var DropMenu = Class.create({
    options: {
        hoverClass: "hover",                                // The class applied to a menu when it's hovered over
        dropdownElement: "ul",                              // The element type of the dropdowns to look for
        showLeft: 0,                                        // Set null to use parent element width, non-zero values require units ie: "200px" or "20em"
        effects: {
            show: [ Effect.Appear ],                        // Can use a combination of effects to
            hide: [ Effect.Fade ],                          // show or hide the dropdowns
            showDuration: 0.2,
            hideDuration: 0.2,
            transition: Effect.Transitions.linear           // Use spring to make it bouncy, or check http://wiki.github.com/madrobby/scriptaculous/effect-transitions for others
        }
    },
    
    initialize: function(menuItems, options) {
        this.options = Object.extend(Object.extend({ }, this.options), options || { });
        
        this.menuItems = $$(menuItems).collect(function(menuItem) {
            return new DropMenu.Item(menuItem, this.options);
        }.bind(this));
    }
});

DropMenu.Item = Class.create({
    options: { },
    
    initialize: function(element, options) {
        this.options = Object.extend(Object.extend({ }, this.options), options || { });
        
        this.uniqueId = parseInt(Math.random() * 10000000);
        this.element = $(element);
        
        var dropdown = this.element.getElementsBySelector(this.options.dropdownElement)[0];
        
        if (dropdown) {
            if (this.options.effects.show.indexOf(Effect.SlideUp)   != -1 ||
                this.options.effects.show.indexOf(Effect.SlideDown) != -1 ||
                this.options.effects.hide.indexOf(Effect.SlideUp)   != -1 ||
                this.options.effects.hide.indexOf(Effect.SlideDown) != -1) {
                this.dropdown = new Element("div");
                dropdown.insert({ after: this.dropdown });
                this.dropdown.insert(dropdown);   
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
        }
        
        this.effects = [];
        
        this.accessibilityHide();
        
        this.element.observe("mouseover", this.mouseEnter.bind(this)(this.show.bindAsEventListener(this)));
        this.element.observe("mouseout", this.mouseEnter.bind(this)(this.hide.bindAsEventListener(this)));
    },
    
    accessibilityShow: function() {
        if (this.hasDropDown()) {
            this.dropdown.setStyle({ left: this.showLeft, display: 'block', opacity: 1 });
        }
    },
    
    accessibilityHide: function() {
        if (this.hasDropDown()) {
            this.dropdown.setStyle({ left: this.hideLeft, display: this.hideDisplay, opacity: 0 });
        }
    },
    
    mouseEnter: function(handler) {
        return function(event) {
            var relatedTarget = event.relatedTarget;
            if (relatedTarget == null) return;
            if (!relatedTarget.descendantOf) return;

            if (this === relatedTarget || relatedTarget.descendantOf(this)) return;
            handler.call(this, event);
        }
    },
    
    hasDropDown: function() {
        return this.dropdown != null;
    },
    
    clearEffect: function() {
        if (!this.currentEffect) return;
        
        this.currentEffect.cancel();
        this.dropdown.setStyle({ height: 'auto' });
    },
    
    show: function(event) {
        this.element.classNames().add(this.options.hoverClass);
        
        if (this.hasDropDown()) {
            this.clearEffect();
            
            var effects = [];
            
            this.options.effects.show.each(function(effect) {
                effects.push(effect(this.dropdown, { sync: true }));
            }.bind(this));
            
            this.currentEffect = new Effect.Parallel(effects, {
                duration: this.options.effects.showDuration,
                transition: this.options.effects.transition,
                queue: { position: 'end', scope: 'dropmenu-show' },
                afterSetup: function() {
                    this.accessibilityShow();
                }.bind(this)
            });
        }
    },
    
    hide: function(event) {
        this.element.classNames().remove(this.options.hoverClass);
        
        if (this.hasDropDown()) {
            this.clearEffect();
            
            var effects = [];
            
            this.options.effects.hide.each(function(effect) {
                effects.push(effect(this.dropdown, { sync: true }));
            }.bind(this));
            
            this.currentEffect = new Effect.Parallel(effects, {
                duration: this.options.effects.hideDuration,
                queue: { position: 'end', scope: 'dropmenu-hide' },
                afterFinish: function() {
                    this.accessibilityHide();
                }.bind(this)
            });
        }
    }
});