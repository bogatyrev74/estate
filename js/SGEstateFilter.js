/**
 * SGEstateFilter
 *
 */
( function( $ ) {

    window.SGEstateFilter = ( function()
    {
        var _init = false,
          items = [],
          settings = {},
          filterCounter = 0,
          $filterCounterContainer = false,
          $filterCounterLine = false,
          $filterCounterText = false,
          filterCounterElements = false,
          $filterActiveElements = $(),
          filterActiveElementsUIds = [],
          $noResultsContainer = false,
          $resultsTextContainer = false,
          selectedUids = [], 
          filterUpdateMode = 'filter',
          isotopeOptions = {},
          $slickShadowList = false,
          app = {};

        app.$isotopeGrid = undefined;
        app.$slick = false;
        app.active = false;

        app.init = function( options, filterItems )
        {
            settings = $.extend( {
                // filterDimensionTypes: ["slider", "multiselect"],
                triggerClass: 'sg-estate-filter',
                // @todo move to generic option
                isotopeContainer: '.grid',
                isotopeLayoutMode: 'fitRows',
                // @todo move to generic option
                isotopeItemSelector: '.sg-estate-filter-item',
                // @todo move to generic option
                isotopeIgnoreFilterSelector: '.js-sg-estate-filter-item-ignore',
                slickContainerSelector: '.js-slick-slider-filter',
                slickItemSelector: '.sg-estate-filter-item',
                slickShadowListSelector: '.js-estate-slick-slider-shadow-list',
                slickOptions: {
                    dots: true,
                    infinite: false,
                    speed: 300,
                    slidesToShow: 1,
                    slidesToScroll: 1,
                    mobileFirst: true,
                    adaptiveHeight: true,
                    responsive: [
                        {
                            breakpoint: 1200,
                            settings: {
                                slidesToShow: 3,
                                slidesToScroll: 1
                            }
                        },
                        {
                            breakpoint: 768,
                            settings: {
                                slidesToShow: 2,
                                slidesToScroll: 1
                            }
                        }
                    ]
                },
                filterCounterContainerId: 'sg-estate-filter-counter',
                filterCounterLineContainerClass: 'sg-estate-filter-counter-line',
                filterCounterLineAnimation: {
                    bounceFontSize: '20px',
                    defaultFontSize: '18px'
                },
                filterCounterTextClass: 'sg-estate-filter-counter-text',
                filterCounterText: 'XX passende Wohnungen',
                filterCounterTextSingular: 'XX passende Wohnung',
                filterCounterNoResultsText: 'Leider keine Treffer',
                filterCounterElements: [
                    {
                        selector: '.js-sg-estate-filter-counter-container',
                        template: '<span class="d-none d-md-block">|desktop|</span><span class="d-md-none">|mobile|</span>',
                        text: 'XX Wohnungen anzeigen',
                        textDesktop: 'Zu den XX ausgewählten Wohnungen springen',
                        textSingular: 'Wohnung anzeigen',
                        textSingularDesktop: 'Zur passenden Wohnung springen',
                        textNoResult: 'Leider keine Treffer',
                        textNoResultDesktop: 'Leider keine Treffer',
                        callback: false
                    },
                    // {
                    //     selector: '#sg-estate-filter-counter-text',
                    //     template: '',
                    //     text: 'XX passende Wohnungen',
                    //     textDesktop: 'Zu den XX passenden Wohnungen',
                    //     textSingular: 'XX passende Wohnung',
                    //     textSingularDesktop: 'Zur passenden Wohnung',
                    //     textNoResult: 'Leider keine Treffer',
                    //     textNoResultDesktop: 'Leider keine Treffer für Suchanfrage',
                    //     callback: function( $item, visibleElements ){}
                    // }
                ],
                filterItemActiveClass: 'sg-estate-filter-item-active',
                noResultsContainerId: 'sg-estate-filter-no-results',
                noResultsHiddenClass: 'd-none',
                resultsTextContainerId: 'sg-estate-filter-results-text',
                resultsTextHiddenClass: 'd-none',
                callOnChangeOnInit: true,
                callDefaultMapsMarkerUpdate: true,
                showDefaultCounterLineAnimation: true,
                mode: 'filter', // filter, selection (w/ filter)
                filterLibrary: 'isotope', // "isotope" and "slick" are possible values
                onChange: function( $activeElements, activeElementsUIds ) {},
                // will be fired if the current set of active elements differs from the previous
                // set of active elements after a filter update
                onActiveElementsUpdate: function() {},
                /**
                 * Determines whether the plugin should use the imagesLoaded jQuery Plugin
                 * to ensure thet all images are loaded before isotope live filtering gets initialised.
                 * Remember that we will only call imagesLoaded if this value is true and the function
                 * imagesLoaded exists
                 * @see  http://isotope.metafizzy.co/layout.html#imagesloaded
                 * @type {Boolean}
                 */
                useImagesLoaded: true
            }, options );

            items = $.extend( {
                // use a jquery instance of SGEstateSlider
                slider: false,
                // use a jquery instance of SGEstateMultiselect
                multiselect: false,
                // use a jquery instance of SGEstateCheckbox
                checkbox: false,
                // pass a reference of window.SGEMegaselect if you'd like to use it
                megaselect: false,
                // use a jquery instance of SGEstateBadge
                badge: false,
            }, filterItems );

            // Only init filtering if trigger class is available
            if( $( '.'+settings.triggerClass ).length > 0 )
            {
                // Check whether isotope is available and die if its not set
                if( useIsotope() && typeof $.fn.isotope === 'undefined' ) {
                    console.error("SGEstateFilter.init: $.isotope() is not defined. Please include Isotope module.");
                    return;
                }

                if( useSlick() && typeof $.fn.slick === 'undefined' ) {
                    console.error("SGEstateFilter.init: $.slick() is not defined. Please include Slick module.");
                    return;
                }
                

                // mark as active
                app.active = true;

                // also get all data attributes and extend settigns
                settings = $.extend( settings, $( '.'+settings.triggerClass ).data() );

                if( useIsotope() ) {
                    
                    isotopeOptions = {
                        itemSelector: settings.isotopeItemSelector,
                        layoutMode: settings.isotopeLayoutMode,
                        percentPosition: true,
                        filter: filterFunction,
                    }
                    // init Isotope w/ initial filtering
                    // or prepend imagesLoaded if option set to true and module is avalable
                    if( settings.useImagesLoaded == true && typeof $.fn.imagesLoaded !== 'undefined' )
                    {
                        // wait for all images in isotope grid to be loaded.
                        // may be obsolete if height && width of image are set (e.g. focuspoint).
                        $( settings.isotopeContainer ).imagesLoaded( function()
                        {
                            initIsotope()
                            initVars()
                        });
                    }
                    else
                    {
                        initIsotope()
                        initVars()
                    }
                }
                if( useSlick() ) {
                    $slickShadowList = $(settings.slickShadowListSelector).find(settings.slickItemSelector)
                    initSlick()
                    initVars()
                }
            }
        };

        app.update = function()
        {
            filterUpdateMode = 'filter';
            
            if(useIsotope()) {
                updateIsotope()
            }
            if(useSlick()) {
                updateSlick()
            }
            // updates the counter var and sets the counter value to the html container
            updateVisibleElementsCounter();
            // call default map marker update if setting is true and module is set
            if( settings.callDefaultMapsMarkerUpdate )
            {
                triggerStandardMapsMarkerUpdate();
            }
            // call onchange callback if function
            if( typeof settings.onChange === "function" )
            {
                settings.onChange( $filterActiveElements, filterActiveElementsUIds );
            }
        };

        app.updateSelection = function( selection, updateMap ) {
            // @todo implement for slick slider
            if(useSlick()) {
                console.error('Selection mode is not yet implemented for slick slider. Use isotope instead.')
                return
            }

            if( settings.mode === 'selection') {
                filterUpdateMode = 'selection';
                selectedUids = selection;
                if( selectedUids.length > 0 ) {
                    var selectedIsotopeOptions = {
                        itemSelector: settings.isotopeItemSelector,
                        layoutMode: settings.isotopeLayoutMode,
                        percentPosition: true,
                        filter: filterSelectedFunction,
                    };
                    $isotopeGrid.isotope( selectedIsotopeOptions );
                    // updates the counter var and sets the counter value to the html container
                    updateVisibleElementsCounter();
                }
                else {
                    app.update();
                }
            }
        };

        app.updateAndRespectMapsSelection = function() {
            // call updateSelection if in selection mode
            // and bail early
            if( settings.mode === 'selection' &&
              typeof window.SGEstateMaps !== "undefined" &&
              window.SGEstateMaps.active) {
                selectedUids = window.SGEstateMaps.getSelectedMarkerUids();
                if( selectedUids.length > 0 ) {
                    app.updateSelection( selectedUids, false );
                }
                else {
                    app.update();
                }
            }
            else {
                app.update();
            }
        }

        app.resetSelectionAndUpdate = function() {
            if( settings.mode === 'selection' ) {
                selectedUids = [];
                app.update();
            }
        };

        app.appendElements = function( $elements ) {
            if( !app.active ) { return; }

            // @todo implement for slick slider
            if(useSlick()) {
                console.error('Appending elements is not yet implemented for slick slider. Use isotope instead.')
                return
            }

            $isotopeGrid.append( $elements ).isotope( 'appended', $elements );
        }

        app.removeElements = function( $elements ) {
            if( !app.active ) { return; }

            // @todo implement for slick slider
            if(useSlick()) {
                console.error('Removing elements is not yet implemented for slick slider. Use isotope instead.')
                return
            }

            $isotopeGrid.isotope( 'remove', $elements );
        }

        /**
         * Starts the isotope live filtering and inits container vars and the update function.
         * May be called from either imagesLoaded or app.init
         */
        var initVars = function()
        {
            // init filtercounter
            $filterCounterContainer = $( '#'+settings.filterCounterContainerId );
            $filterCounterLine = $( '.'+settings.filterCounterLineContainerClass );
            $filterCounterText = $( '.'+settings.filterCounterTextClass );
            // add no results container if available
            $noResultsContainer = $( '#'+settings.noResultsContainerId );
            // populate container that holds text that should be visible if we have results
            $resultsTextContainer = $( '#'+settings.resultsTextContainerId );

            initFilterCounterElements();

            // updates the counter var and sets the counter value to the html container
            updateVisibleElementsCounter();
            if( settings.callOnChangeOnInit )
            {
                // call default map marker update if setting is true and module is set
                if( settings.callDefaultMapsMarkerUpdate )
                {
                    triggerStandardMapsMarkerUpdate();
                }
                // call onchange callback if function
                if( typeof settings.onChange === "function" )
                {
                    settings.onChange( $filterActiveElements, filterActiveElementsUIds );
                }
            }
        }

        var initIsotope = function() {
            $isotopeGrid = $( settings.isotopeContainer ).isotope( isotopeOptions )
        }

        var updateIsotope = function() {
            $isotopeGrid.isotope( isotopeOptions )
        }

        var initSlick = function() {
            app.$slick = $(settings.slickContainerSelector)
            app.$slick.slick(settings.slickOptions)
            updateSlick()
        }

        var updateSlick = function() {
            $slickShadowList.each(function(){
                var $this = $(this)
                
                var boundFilterFunction = filterFunction.bind(this)
                var active = boundFilterFunction()
                // does element exist in slider?
                var inSlider = app.$slick.find('[data-uid="'+$this.data('uid')+'"]').length > 0
                if( active && !inSlider) {
                    app.$slick.slick('slickAdd', '<div><div>'+this.outerHTML+'</div></div>')
                }
                if( !active && inSlider) {
                    var index = app.$slick.find(settings.slickItemSelector).index(app.$slick.find('[data-uid="'+$this.data('uid')+'"]'))
                    app.$slick.slick('slickRemove', index)
                }
            })
        }


        var filterFunction = function()
        {
            var r = true;
            var $this = $( this );
            // the first "false" return value stops the evaluation
            if( $this.filter(settings.isotopeIgnoreFilterSelector).length > 0 ) {
                return true;
            }
            // check if we should ignore this item
            if (items.badge)
            {
                var badgesCount = items.badge.length
                var badgesFilterString = ''
                for (var badgesIndex = 0; badgesIndex < badgesCount; badgesIndex++)
                {
                    var badge = items.badge[badgesIndex]
                    if (typeof badge.sgfilter.lastValue !== 'undefined' && badge.sgfilter.lastValue !== '')
                    {
                        if (badgesFilterString.length > 0)
                        {
                            badgesFilterString += ', '
                        }
                        badgesFilterString += badge.sgfilter.lastValue
                    }
                }
                if (badgesFilterString !== '' && $this.filter(badgesFilterString).length === 0)
                {
                    r = false
                }
            }
            if( r && items.checkbox ) {
                var c = items.checkbox.length;
                for( var i = 0; i < c; i++ ) {
                    var plainElement = items.checkbox[i];
                    if( typeof plainElement.sgfilter.lastValue !== 'undefined' && plainElement.sgfilter.lastValue !== '' ) {
                        if( $( this ).filter( plainElement.sgfilter.lastValue ).length === 0 ) {
                            r = false;
                            break;
                        }
                    }
                }
            }
            if( r && items.slider )
            {
                var c = items.slider.length;
                for( var i = 0; i < c; i++ )
                {
                    var plainElement = items.slider[i];
                    var thisValue = parseFloat( $this.data( plainElement.sgfilter.attribute ) );
                    if( evalSlider( plainElement, thisValue ) === false )
                    {
                        r = false;
                        break;
                    }
                }
            }
            if( r && items.multiselect )
            {
                var c = items.multiselect.length;
                for( var i = 0; i < c; i++ )
                {
                    var plainElement = items.multiselect[i];
                    var filterValue = plainElement.sgfilter.lastValue;
                    if( filterValue && filterValue !== "" )
                    {
                        // if filter does not match the result will be a length of 0
                        if( $(this).filter( filterValue ).length === 0 )
                        {
                            r = false;
                            break;
                        }
                    }
                }
            }
            if( r && items.megaselect ) {
                // combined selector is a huge selector that contains all
                // selectors of all selected items separated by comma
                // only OR connection until now
                var selector = items.megaselect.getCombinedSelector();
                if( selector !== '' ) {
                    if( $this.filter( selector ).length === 0 ) {
                        r = false;
                    }
                }
            }

            if( r )
            {
                $this.addClass( settings.filterItemActiveClass );
            }
            else
            {
                $this.removeClass( settings.filterItemActiveClass );
            }
            return r;
        };

        var filterSelectedFunction = function() {
            var r = false;
            if( selectedUids.length > 0 ) {
                var uid = $( this ).data('uid');
                if( typeof uid !== 'undefined' && selectedUids.indexOf(uid) >= 0 ) {
                    r = true;
                }
            }
            return r;
        };

        var getVisibleElementsCount = function()
        {
            // get all active elements via active class
            var selector = settings.isotopeItemSelector
            if(useSlick()) {
                // only select those in the shadow list!
                selector = settings.slickShadowListSelector+' '+settings.slickItemSelector
            }
            $filterActiveElements = $( selector ).filter('.'+settings.filterItemActiveClass);
            // Generate Array with Uids from Active Elements
            filterActiveElementsUIds = [];
            for(var i = 0; i < $filterActiveElements.length; i++ )
            {
                var $thisActiveElement = $( $filterActiveElements[i] );
                if( $thisActiveElement.attr( 'data-uid' ) )
                {
                    filterActiveElementsUIds.push( parseInt( $thisActiveElement.attr( 'data-uid' ) ) );
                }
            }
            // return the number of active elements
            return $filterActiveElements.length;
        };

        var updateVisibleElementsCounter = function()
        {
            // get current filter count
            if( filterUpdateMode === 'filter' ) {
                filterCounter = getVisibleElementsCount();
            }
            else {
                filterCounter = selectedUids.length;
            }

            if( $filterCounterContainer.length > 0 )
            {
                // see if we need to update the counter
                if( parseInt($filterCounterContainer.html()) != filterCounter )
                {
                    // update filter container
                    $filterCounterContainer.html( filterCounter );
                    // make standard animation for
                    if( settings.showDefaultCounterLineAnimation )
                    {
                        doCounterLineAnimation( $filterCounterContainer );
                    }
                }
            }

            // update result container visibility
            if( $noResultsContainer.length > 0 || $resultsTextContainer.length > 0 )
            {
                if( filterCounter == 0 )
                {
                    $noResultsContainer.removeClass( settings.noResultsHiddenClass );
                    $resultsTextContainer.addClass( settings.resultsTextHiddenClass );
                }
                else
                {
                    $noResultsContainer.addClass( settings.noResultsHiddenClass );
                    $resultsTextContainer.removeClass( settings.resultsTextHiddenClass );
                }
            }

            if( $filterCounterText.length > 0 )
            {
                var text = '';
                if( filterCounter > 0 )
                {
                    $noResultsContainer.addClass( settings.noResultsHiddenClass );
                    if( filterCounter > 1 )
                    {
                        text = settings.filterCounterText.replace(/XX/i, filterCounter);
                    }
                    else
                    {
                        text = settings.filterCounterTextSingular.replace(/XX/i, filterCounter);
                    }
                }
                else
                {
                    $noResultsContainer.removeClass( settings.noResultsHiddenClass );
                    text = settings.filterCounterNoResultsText.replace(/XX/i, filterCounter);
                }
                $filterCounterText.html( text );
                // make standard animation for
                if( settings.showDefaultCounterLineAnimation )
                {
                    doCounterLineAnimation( $filterCounterText );
                }
            }

            updateFilterCounterElements( filterCounter );

            // fire update event
            if( typeof settings.onActiveElementsUpdate === "function" )
            {
                settings.onActiveElementsUpdate();
            }


        };

        var getSliderValue = function( plainElement )
        {
            return plainElement.sgfilter.lastValue;
        };

        var evalSlider = function( plainElement, compareValue )
        {
            var r = true;
            if( plainElement.sgfilter.direction == "max" )
            {
                r = ( plainElement.sgfilter.lastValue <= compareValue );
            }
            else
            {
                r = ( plainElement.sgfilter.lastValue >= compareValue );
            }
            return r;
        };

        /**
         * Update maps marker if SGEstateMaps module is active and settings allow that
         */
        var triggerStandardMapsMarkerUpdate = function()
        {
            if( typeof window.SGEstateMaps !== "undefined" && window.SGEstateMaps.active )
            {
                window.SGEstateMaps.updateMarkerVisibility( filterActiveElementsUIds );
            }
        };

        var doCounterLineAnimation = function( $element )
        {
            if( $element.length > 0 )
            {
                $element.animate({
                    fontSize: settings.filterCounterLineAnimation.bounceFontSize
                }, 100, function() {
                    $element.animate({
                        fontSize: settings.filterCounterLineAnimation.defaultFontSize
                    }, 100);
                });
            }
        };

        var initFilterCounterElements = function() {
            filterCounterElements = [];
            if( settings.filterCounterElements.length > 0 ) {
                $.each( settings.filterCounterElements, function() {
                    var $element = $( this.selector );
                    if( $element.length > 0 ) {
                        $element.data( this );
                        filterCounterElements.push( $element );
                    }
                });
            }
        };

        var updateFilterCounterElements = function( visibleElements ) {
            $.each( filterCounterElements, function() {
                var $this = $( this );
                var data = $this.data();
                if( typeof data.callback === 'function' ) {
                    data.callback( $this, visibleElements );
                }
                else {
                    var text = '';
                    var textDesktop = '';
                    if( visibleElements > 1 ) {
                        text = data.text;
                        textDesktop = data.textDesktop || data.text;
                    }
                    else if( visibleElements === 1 ) {
                        text = data.textSingular || data.text;
                        textDesktop = data.textSingularDesktop || data.textSingular || data.textDesktop || data.text;
                    }
                    else {
                        text = data.textNoResult;
                        textDesktop = data.textNoResultDesktop || data.textNoResult;
                    }

                    text = text.replace("XX", visibleElements );
                    textDesktop = textDesktop.replace("XX", visibleElements );

                    var html = text;
                    if( typeof data.template !== 'undefined' ) {
                        html = data.template.replace("|mobile|", text).replace("|desktop|", textDesktop);
                    }
                    $this.html( html );
                }
            });
        };

        var useIsotope = function() {
            return settings.filterLibrary === 'isotope'
        }

        var useSlick = function() {
            return settings.filterLibrary === 'slick'
        }

        return app;
    })();

})( jQuery );