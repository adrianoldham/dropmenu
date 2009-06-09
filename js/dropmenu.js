var DropMenu = Class.create({
    options: {
        hoverClass: "hover",                                // The class applied to a menu when it's hovered over
        dropdownClass: "dropdown",                          // The class of the dropdowns to look for
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
        
        var dropdown = this.element.getElementsBySelector('.' + this.options.dropdownClass)[0];
        this.dropdown = new Element("div");
        dropdown.insert({ after: this.dropdown });
        this.dropdown.insert(dropdown);
        
        // Apply drop down class to new wrapper div
        this.dropdown.classNames().add(this.options.dropdownClass);
        dropdown.classNames().remove(this.options.dropdownClass);
        
        this.effects = [];
        
        if (this.hasDropDown()) this.dropdown.hide();
        
        this.element.observe("mouseover", this.mouseEnter.bind(this)(this.show.bindAsEventListener(this)));
        this.element.observe("mouseout", this.mouseEnter.bind(this)(this.hide.bindAsEventListener(this)));
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
                queue: { position: 'end', scope: 'dropmenu-show' }  
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
                queue: { position: 'end', scope: 'dropmenu-hide' }  
            });
        }
    }
});