var DropMenu = Class.create({
    options: {
        rootItems: null,                                // Set a selector to this if you want to enable root click functionality

        hoverClass: "hover",                            // The class applied to a menu when it's hovered over
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
        // Allow for backwards compatibility for effects options {}
        if (this.options.effects != null) {
            this.options = Object.extend(Object.extend({ }, this.options.effects, this.options), options || { });
        } else {
            this.options = Object.extend(Object.extend({ }, this.options), options || { });
        }

        var rootItems = $$(this.options.rootItems);

        this.menuItems = $$(menuItems).collect(function(menuItem) {
            return new DropMenu.Item(menuItem, this.options, this, rootItems);
        }.bind(this));
    },

    hideAll: function(caller) {
        this.menuItems.each(function(menuItem) {
            if (caller.element.ancestors().indexOf(menuItem.element) == -1) {
                menuItem.hide(null, true);
            }
        });
    }
});

DropMenu.Item = Class.create({
    options: { },

    initialize: function(element, options, parent, rootItems) {
        this.options = Object.extend(Object.extend({ }, this.options), options || { });

        this.uniqueId = parseInt(Math.random() * 10000000);
        this.element = $(element);
        this.parent = parent;
        this.rootItems = rootItems;

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

        if (this.rootItems.indexOf(this.element) != -1) {
            this.element.observe("click", this.toggleShow.bind(this));
        } else {
            this.element.observe("mouseover", this.mouseEnter.bind(this)(this.delayShow.bindAsEventListener(this)));
            this.element.observe("mouseout", this.mouseEnter.bind(this)(this.delayHide.bindAsEventListener(this)));
        }
    },

    toggleShow: function(event) {
        if (this.visible) {
            this.hide(event);
        } else {
            this.parent.hideAll(this);
            this.show(event);
        }
    },

    accessibilityShow: function() {
        if (this.hasDropDown()) {
            this.visible = true;
            this.dropdown.setStyle({ left: this.showLeft, display: 'block', opacity: 1 });
        }
    },

    accessibilityHide: function() {
        if (this.hasDropDown()) {
            this.visible = false;
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

    delayShow: function(event) {
        this.parent.hideAll(this);

        this.element.addClassName(this.options.hoverClass);

        // Clear show timer if menu is hidden
        clearTimeout(this.showDelayTimer);
        clearTimeout(this.hideDelayTimer);

        // Clear previous timers, and start timer for delay
        clearTimeout(this.showDelayTimer);
        this.showDelayTimer = setTimeout(this.show.bind(this, event), this.options.showDelay * 1000);
    },

    show: function(event) {
        this.element.addClassName(this.options.hoverClass);

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

    delayHide: function(event) {
        this.element.removeClassName(this.options.hoverClass);

        // Clear previous timers, and start timer for delay
        clearTimeout(this.hideDelayTimer);
        this.hideDelayTimer = setTimeout(this.hide.bind(this, event), this.options.hideDelay * 1000);
    },

    hide: function(event, ignoreScope) {
        // Clear show timer if menu is hidden
        clearTimeout(this.showDelayTimer);
        clearTimeout(this.hideDelayTimer);

        var effectOptions = {
            duration: this.options.effects.hideDuration,
            afterFinish: function() {
                this.accessibilityHide();
            }.bind(this)
        };

        if (ignoreScope != true) {
            effectOptions.queue = { position: 'end', scope: 'dropmenu-hide' };
        }

        this.element.removeClassName(this.options.hoverClass);

        if (this.hasDropDown()) {
            this.clearEffect();

            var effects = [];

            this.options.effects.hide.each(function(effect) {
                effects.push(effect(this.dropdown, { sync: true }));
            }.bind(this));

            this.currentEffect = new Effect.Parallel(effects, effectOptions);
        }
    }
});