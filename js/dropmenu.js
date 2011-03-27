(function(){
	function firstCommonAncestor(elm1, elm2){
		var p = elm1.up();
		while( !elm2.descendantOf(p) ){
			p = p.up();
		}
		return p;
	}
	function stopEvent(e){
		try{
			e.stop();
		}catch(ex){}
	}
	Event.observe(document, 'mouseout', function(e){
		var from = e.element();
		var to = e.relatedTarget;
		p = null;
		if ( !to || (from !== to && !to.descendantOf(from))) {
			/* mouseleave should bubble up until the to element because we have left all elements up to that one */
			var stopOn = null;
			if( to ){
				if( from.descendantOf(to) ){
					stopOn = to.childElements();
				}else{
					p = firstCommonAncestor(from, to);
					if( p && to.descendantOf(p) ){
						stopOn = p.childElements();
					}
				}
			}
			if( stopOn ){
				stopOn.invoke('observe', 'custom:mouseleave', stopEvent);
			}
			from.fire('custom:mouseleave');
			if( stopOn ){
				stopOn.invoke('stopObserving', 'custom:mouseleave', stopEvent);
			}
		}
		var p = null;
		if( to && !from.descendantOf(to)){
			/* mouseenter can bubble, no problem! */
			var stopOn = null;
			if( to.descendantOf(from)){
				stopOn = from.childElements();
			}else{
				// do first common ancestor's children, see below.
				p = firstCommonAncestor(to, from);
				stopOn = p.childElements();
			}
			if( stopOn ){
				stopOn.invoke('observe', 'custom:mouseenter', stopEvent);
			}
			to.fire('custom:mouseenter');
			if( stopOn ){
				stopOn.invoke('stopObserving', 'custom:mouseenter', stopEvent);
			}
		}
	});
})();

var DropMenu = Class.create({
    options: {
        osMode: false,                                  // Sets this to enable 'OS' type of behaviour
        rootItems: null,                                // Set a selector to this if you want to enable root click functionality

        activeClass: "active",                          // The class applied when a dropdown is visible
        hoverClass: "hover",                            // The class applied to a menu when it's hovered over
        hasDropdownClass: "has-dropdown",               // The class applied to a menu if it has a dropdown
        
        dropdownElement: "ul",                          // The element type of the dropdowns to look for
        showLeft: 0,                                    // Set null to use parent element width, non-zero values require units ie: "200px" or "20em"

        show: [ Effect.Appear ],                        // Can use a combination of effects to
        hide: [ Effect.Fade ],                          // show or hide the dropdowns
        showDelay: 0,
        hideDelay: 0,
        showDuration: 0.2,
        hideDuration: 0.2,
        transition: Effect.Transitions.linear           // Use spring to make it bouncy, or check http://wiki.github.com/madrobby/scriptaculous/effect-transitions for others
    },

    initialize: function(menuItems, options) {
        var effectOptions;
         
        // Add backwards compatibility in terms of effects options
        if (options.effects != null) {
            effectOptions = Object.extend({ }, this.options, options.effects);
        } else {
            effectOptions = Object.extend({ }, this.options);
        }
        
        this.options = Object.extend(effectOptions, options || { });

        // Find the root items
        this.rootItems = $$(this.options.rootItems);
        
        // Setup each menu item
        this.menuItems = $$(menuItems).collect(function(menuItem) {
            return new DropMenu.Item(menuItem, this.options, this);
        }.bind(this));
        
        $(document.body).observe('click', this.documentClick.bindAsEventListener(this));
    },

    forceDelayedHides: function(caller) {
        this.menuItems.each(function(menuItem) {
            // If visible, then hide straight away
            if (caller != null && (menuItem.element == caller.element || caller.element.ancestors().indexOf(menuItem.element) != -1)) {
            } else {
                menuItem.hide();
            }
        });
    },
    
    // Handles clicking outside menu to close menu
    documentClick: function(event) {
        var ignore = false;
        
        this.menuItems.each(function(menuItem) {
            if ($(event.target).ancestors().indexOf(menuItem.element) != -1 || menuItem.element == event.relatedTarget) {
                ignore = true;
            }
        });
        
        if (!ignore) {
            this.forceDelayedHides();
            this.rootActive = false;
        }
    }
});

DropMenu.Item = Class.create({
    options: { },

    initialize: function(element, options, parent) {
        this.options = Object.extend(Object.extend({ }, this.options), options || { });
        
        this.element = $(element);
        this.parent = parent;
        
        // Setup a dropdown if one exists
        this.setupDropdown();
        
        // Hide by default
        this.accessibilityHide();

        // If OS mode, then use click for root elements
        if (this.isOsRoot()) {
            this.anchor = this.element.getElementsBySelector('a').first();
            
            this.anchor.observe("click", this.toggleShow.bindAsEventListener(this));
            this.anchor.observe('custom:mouseenter', this.rootShow.bind(this));
            this.anchor.observe("blur", this.rootHide.bindAsEventListener(this));
        } else {
            this.element.observe('custom:mouseenter', this.delayShow.bind(this));
            
            if (this.options.osMode == false) {
                // Handle delayed show and hides
                this.element.observe('custom:mouseleave', this.delayHide.bind(this));   
            }
        }
        
        // Handles hover class
        this.element.observe('custom:mouseenter', this.onHover.bind(this));
        this.element.observe('custom:mouseleave', this.onHoverOut.bind(this));
    },
    
    setupDropdown: function() {
        var dropdown = this.element.getElementsBySelector(this.options.dropdownElement)[0];

        if (dropdown !== undefined) {
            // If using any sort of sliding effect, we need to add a wrapper around the dropdown
            if (this.options.effects.show.indexOf(Effect.SlideUp)   != -1 ||
                this.options.effects.show.indexOf(Effect.SlideDown) != -1 ||
                this.options.effects.hide.indexOf(Effect.SlideUp)   != -1 ||
                this.options.effects.hide.indexOf(Effect.SlideDown) != -1) {
                
                this.dropdown = dropdown.wrap("div");
            } else {
                this.dropdown = dropdown;
            }
            
            this.hideLeft = this.dropdown.getStyle('left');
            this.hideDisplay = this.dropdown.getStyle('display');

            if (this.options.showLeft == null) {
                this.showLeft = this.dropdown.getStyle('width');
            } else {
                this.showLeft = this.options.showLeft;
            }
            
            this.element.addClassName(this.options.hasDropdownClass);
        }
    },
    
    isOsRoot: function() {
        return (this.options.osMode == true && this.parent.rootItems.indexOf(this.element) != -1);
    },
    
    onHover: function() {
        this.element.addClassName(this.options.hoverClass);
    },
    
    onHoverOut: function() {
        this.element.removeClassName(this.options.hoverClass);
    },
    
    rootHide: function() {
        this.parent.forceDelayedHides(this);
        this.hide();
    },

    rootShow: function() {
        this.parent.forceDelayedHides(this);
        this.show(0);
    },

    toggleShow: function() {
        // Toggle active state
        this.parent.rootActive = !this.parent.rootActive;
        
        // Toggle global root active status
        if (!this.parent.rootActive) {
            this.rootHide();
        } else {
            this.rootShow();
        }
        
        event.preventDefault();
        
        return false;
    },

    accessibilityShow: function() {
        this.active = true;
        
        if (this.dropdown != null) {
            this.element.addClassName(this.options.activeClass);
            this.dropdown.setStyle({ left: this.showLeft, display: 'block', opacity: 1 });
        }
    },

    accessibilityHide: function() {
        this.active = false;
        this.hiding = false;
        
        if (this.dropdown != null) {
            this.element.removeClassName(this.options.activeClass);
            this.dropdown.setStyle({ left: this.hideLeft, display: this.hideDisplay, opacity: 0 });
        }
    },

    reset: function() {
        // Clear any active effects
        if (this.currentEffect != null) {
            this.currentEffect.cancel();
            this.dropdown.setStyle({ height: 'auto' });   
        }
        
        // Clear all timers
        clearTimeout(this.showDelayTimer);
        clearTimeout(this.hideDelayTimer);
    },

    delayShow: function() {
        // On show of a menu item, quickly hide any items that have a delayed hide
        this.parent.forceDelayedHides(this);
        
        // Cancel any previous effects to avoid double effect
        this.reset();

        // Restart delay timer
        this.showDelayTimer = setTimeout(this.show.bind(this), this.options.showDelay * 1000);
    },

    show: function(duration) {
        if (this.options.osMode) {
            if (this.isOsRoot() && !this.parent.rootActive) {
                return;
            }
        }
        
        // If dropdown exists
        if (this.dropdown != null) {
            // Cancel any previous effects to avoid double effect
            this.reset();

            var effects = [];
            
            // Loop through all effects in options and create them
            this.options.effects.show.each(function(effect) {
                effects.push(effect(this.dropdown, { sync: true }));
            }.bind(this));

            // Perform the affect
            this.currentEffect = new Effect.Parallel(effects, {
                duration: (duration == null ? this.options.effects.showDuration : duration),
                transition: this.options.effects.transition,
                queue: { position: 'end', scope: 'dropmenu-show' },
                afterSetup: function() {
                    // Afters setup of effect, make sure it's visible then show affect
                    this.accessibilityShow();
                }.bind(this)
            });
        }
    },

    delayHide: function() {
        // Notify that we are currently hiding the element
        this.hiding = true;
        
        // Reset timers and effects
        this.reset();

        // Restart delay timer
        this.hideDelayTimer = setTimeout(this.hide.bind(this), this.options.hideDelay * 1000);
    },

    hide: function() {
        if (this.dropdown != null) {
            this.element.removeClassName(this.options.activeClass);
            
            // Cancel any previous effects to avoid double effect
            this.reset();

            var effects = [];

            this.options.effects.hide.each(function(effect) {
                effects.push(effect(this.dropdown, { sync: true }));
            }.bind(this));

            this.currentEffect = new Effect.Parallel(effects, {
                duration: this.options.effects.hideDuration,
                afterFinish: function() {
                    this.accessibilityHide();
                }.bind(this)
            });
        }
    }
});