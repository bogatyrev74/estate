/**
 * SGEstateFilter
 * 
 */
( function( $ ) {

    window.SGEstateLiveFilter = ( function()
    {
        var _init = false,
        items = [],
        realtyData = [],
        cityData = [],
        settings = {},
        $filterContainer = false,
        filterCounter = 0,
        $filterCounterContainer = false,
        $filterCounterLine = false,
        $city = false,
        $district = false,
        $groupedCityAndDistrict = false,
        selectedLocation = {
            city: 0,
            district: 0
        },
        ajaxUrl = false,
        groupedMode = true,
        loadingTextInterval = false,
        loadingTextIndex = 0,
        app = {};

        app.active = false;

        app.init = function( options, filterItems )
        {
            settings = $.extend( {
                // filterDimensionTypes: ["slider", "multiselect"],
                triggerClass: 'sg-estate-live-filter',
                sliderClass: 'sg-estate-live-filter-slider',
                liveFilterContainerClass: 'sg-estate-live-filter-con',
                liveFilterContainerLoadingClass: 'sg-estate-live-filter-con__loading',
                liveFilterContainerActiveClass: 'sg-estate-live-filter-con__active',
                liveFilterLoadingTextContainerClass: 'sg-estate-live-filter-loading-text',
                liveFilterLoadingTextSpeed: 4000,
                liveFilterLoadingText: [
                    'Immobiliendaten werden geladen',
                    'Wir sind gleich fertig',
                    'In einem Augenblick geht´s los'
                ],
                liveFilterLoadingErrorText: 'Beim Laden der Immobiliendaten ist leider ein Fehler aufgetreten. Bitte laden Sie diese Seite erneut.',
                filterCounterContainerId: 'sg-estate-filter-counter',
                filterCounterLineContainerClass: 'sg-estate-filter-counter-line',
                filterCounterLineAnimation: {
                    bounceFontSize: '20px',
                    defaultFontSize: '18px'
                },
                formMap: {
                    city: '.sg-estate-live-filter-city',
                    district: '.sg-estate-live-filter-district',
                    groupedCityAndDistrict: '.sg-estate-live-filter-grouped-city-and-district'
                },
                showAllOnNoSelection: true,
                noSelectionButtonText: 'Bitte wählen Sie eine Stadt',
                noResultsButtonText: 'Leider keine Treffer',
                allSelectionButtonText: 'Alle XX Immobilien anzeigen',
                allSelectionButtonTextSingular: 'XX Immobilie anzeigen',
                selectionButtonText: 'XX Treffer anzeigen',
                selectionButtonTextSingular: 'XX Treffer anzeigen',
                showDefaultCounterLineAnimation: true
            }, options );
            items = $.extend( {}, filterItems );

            // Only init filtering if trigger class is available
            if( $( '.'+settings.triggerClass ).length > 0 )
            {
                // also get all data attributes and extend settigns
                settings = $.extend( settings, $( '.'+settings.triggerClass ).data() );

                if( typeof window.SGEstateBaseLiveSearchData !== 'undefined' )
                {
                    ajaxUrl = window.SGEstateBaseLiveSearchData;

                    // mark as active
                    app.active = true;

                    $filterContainer = $('.'+settings.liveFilterContainerClass);
                    $filterContainer.addClass( settings.liveFilterContainerLoadingClass );
                    // define timeouts
                    initLoadingTextTimeout();

                    $groupedCityAndDistrict = $( settings.formMap.groupedCityAndDistrict );
                    if( $groupedCityAndDistrict.length > 0 )
                    {
                        $groupedCityAndDistrict.on("change", function( e )
                        {
                            resetSelectedLocation();
                            var value = $(this).val();
                            if( value !== '' )
                            {
                                value = value.split('_');
                                if( Array.isArray( value ) )
                                {
                                    if( typeof value[0] !== 'undefined' )
                                    {
                                        selectedLocation.city = parseInt(value[0]);
                                    }
                                    if( typeof value[1] !== 'undefined' )
                                    {
                                        selectedLocation.district = parseInt(value[1]);
                                    }
                                }
                            }
                            app.update();
                        });
                    }
                    else
                    {
                        groupedMode = false;
                        $city = $( settings.formMap.city );
                        $district = $( settings.formMap.district );
                        if( $city.length > 0 )
                        {
                            $city.on("change", function( e )
                            {
                                if( $(this).val() != '' )
                                {
                                    resetSelectedLocation();
                                    selectedLocation.city = parseInt($(this).val());
                                    // get all districts of city
                                    var matchedCity = getCityDataById( selectedLocation.city );
                                    if( matchedCity !== false )
                                    {
                                        if( $district.length > 0 )
                                        {
                                            resetDistrict();
                                            addCurrentDistricts( matchedCity );
                                        }     
                                    }
                                }  
                                else
                                {
                                    resetSelectedLocation();
                                    resetDistrict();  
                                }
                                app.update();
                            });
                        }
                        if( $district.length > 0 )
                        {
                            $district.on("change", function( e )
                            {
                                if( $(this).val() != '' )
                                {
                                    selectedLocation.district = parseInt($(this).val());
                                }
                                else
                                {
                                    selectedLocation.district = 0;
                                }
                                app.update();
                            });
                        }
                    }

                    getRealtyData();
                }
            }     
        };

        app.update = function()
        {
            filterCounter = 0;
            var realtiesCounter = realtyData.length;
            for( var i = 0; i < realtiesCounter; i++ )
            {
                if( filterFunction( realtyData[i] ) )
                {
                    filterCounter++;
                }
            }
            updateSearchButton();
        };

        var getRealtyData = function()
        {
            $.ajax({
               url: ajaxUrl,
               dataType: 'json'
            }).done( function( data )
                {
                    if( data.realties )
                    {
                        realtyData = data.realties;
                    }
                    if( data.cities )
                    {
                        cityData = data.cities;
                    }
                    // console.log("data received: realties %o  cities %o", realtyData, cityData );
                    $filterContainer.removeClass( settings.liveFilterContainerLoadingClass );
                    $filterContainer.addClass( settings.liveFilterContainerActiveClass );
                    app.update();
                }).fail( function( data )
                    {
                        if( loadingTextInterval !== false )
                        {
                            window.clearInterval( loadingTextInterval );
                            $('.'+settings.liveFilterLoadingTextContainerClass).html( settings.liveFilterLoadingErrorText );
                        }
                    });
        };

        var initFormFields = function()
        {
            // city comes prefilled from server.
        };

        var filterFunction = function( entry )
        {
            var r = true;
            // check location
            if( selectedLocation.city > 0 )
            {
                // console.log("%o != %o = %o", entry.city.id, selectedLocation.city, (entry.city.id != selectedLocation.city) );
                if( entry.city.id != selectedLocation.city )
                {
                    r = false;
                }
            }
            if( r && selectedLocation.district > 0 )
            {
                if( entry.district.id !== selectedLocation.district )
                {
                    r = false;
                }
            }
            // // check slider values
            if( r && items.slider )
            {
                var c = items.slider.length;
                for( var i = 0; i < c; i++ )
                {
                    var plainElement = items.slider[i];
                    var thisValue = parseFloat( entry[plainElement.sgfilter.attribute] );
                    r = evalSlider( plainElement, thisValue );
                    if( r === false )
                    {
                        break;
                    }
                }
            }

            return r;
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

        var doCounterLineAnimation = function()
        {
            if( $filterCounterLine.length > 0 )
            {
                $filterCounterLine.animate({
                    fontSize: settings.filterCounterLineAnimation.bounceFontSize
                }, 100, function() {
                    $filterCounterLine.animate({
                        fontSize: settings.filterCounterLineAnimation.defaultFontSize
                    }, 100);
                });
            }
        };

        var updateSearchButton= function()
        {
            var submit = $('.sg-estate-live-search-submit');
            var text = "";
            if( filterCounter > 0 )
            {
                submit.removeAttr("disabled");
                if( cityAndDistrictNotSet() )
                {
                    if( settings.showAllOnNoSelection )
                    {
                        if( filterCounter > 1 )
                        {
                            text = settings.allSelectionButtonText.replace(/XX/i, filterCounter);
                        }
                        else
                        {
                            text = settings.allSelectionButtonTextSingular.replace(/XX/i, filterCounter);
                        }
                    }
                    else
                    {
                        submit.attr("disabled", "disabled");
                        text = settings.noSelectionButtonText;
                    }
                }
                else
                {
                    if( filterCounter > 1 )
                    {
                        text = settings.selectionButtonText.replace(/XX/i, filterCounter);
                    }
                    else
                    {
                        text = settings.selectionButtonTextSingular.replace(/XX/i, filterCounter);
                    } 
                }
            }
            else
            {
                text = settings.noResultsButtonText;
                submit.attr("disabled", "disabled");
            }
            submit.val( text );
        };

        var resetSelectedLocation = function()
        {
            selectedLocation.city = 0;
            selectedLocation.district = 0;
        };

        var cityAndDistrictNotSet = function()
        {
            var r = false;
            if( selectedLocation.city == 0 && selectedLocation.district == 0 )
            {
                r = true;
            }
            return r;
        };

        var resetDistrict = function()
        {
            if( $district.length > 0 )
            {
                $district.attr('disabled', 'disabled');
                $district.html(""); 
                $district.append(
                        $('<option></option>')
                            .attr('value', '0' )
                            .html( 'Alle Stadtteile' )
                        );
            }
        };

        var addCurrentDistricts = function( matchedCity )
        {
            if( matchedCity.districts.length > 0 )
            {
                for( var i = 0; i < matchedCity.districts.length; i++ )
                {
                    $district.append(
                        $('<option></option>')
                            .attr('value', matchedCity.districts[i].id )
                            .html( matchedCity.districts[i].name )
                        );
                }
                $district.removeAttr('disabled');
                $district.focus();
            }
        };

        var getCityDataById = function( cityId )
        {
            var r = false;
            if( cityData != false && Array.isArray( cityData ) && cityData.length > 0 )
            {
                for( var i = 0; i < cityData.length; i++ )
                {
                    if( cityData[i].id == cityId )
                    {
                        // match found
                        r = cityData[i];
                        break;
                    }
                }
            }
            return r;
        };

        var initLoadingTextTimeout = function()
        {
            loadingTextInterval = window.setInterval( function()
            {
                if( $filterContainer.hasClass( settings.liveFilterContainerLoadingClass ) )
                {
                    if( loadingTextIndex < settings.liveFilterLoadingText.length )
                    {
                        $('.'+settings.liveFilterLoadingTextContainerClass).html( settings.liveFilterLoadingText[loadingTextIndex]);
                        loadingTextIndex++;
                    }
                }
                else
                {
                    window.clearInterval( loadingTextInterval );
                }    
            }, settings.liveFilterLoadingTextSpeed );
        };

        return app;
    })();

})( jQuery );