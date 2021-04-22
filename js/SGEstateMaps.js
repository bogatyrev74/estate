/**
 * SGEstateFilter
 *
 */
( function( $ ) {

    window.SGEstateMaps = ( function()
    {
        var _init = false,
        $mapContainer = false,
        mapSettings = {},
        settings = {},
        mapVisible = false,
        markerImages = {}, // .default|hidden|selected
        selectedMarker = [],
        lastFilterUids = [], // from sgestatefilter
        resetSelectionBtn = false,
        app = {};

        app.map = false;
        app.marker = [];
        app.mapMarker = [];
        app.active = false;

        app.init = function( options )
        {
            // Prevent recall of init()
            if( _init )
            {
                return;
            }
            _init = true;

            settings = $.extend( {
                mapContainerSelector: '.sg-estate-map',
                markerImagePath: 'typo3conf/ext/sg_sitepackage/Resources/Public/assets/images/gmaps-marker-default.png',
                markerZIndex: 10,
                markerHiddenImagePath: false,
                markerHiddenZIndex: 2,
                markerSelectedImagePath: false,
                markerSelectedZIndex: 20,
                mapStyles: false,
                showInfoWindow: true,
                markerHasOnClick: true,
                markerOnClickCallbackOverride: false,
                mapTriggerClass: 'sg-estate-has-map',
                mapTriggerSelector: '.sg-estate-list, .sg-estate-detail, .sg-estate-landingpage, .sg-estate-list-map-con',
                mode: 'filter', // filter, selection (w/ filter)
                markerMode: 'hide', // hide, fade (change icon if not active)
                lazyLoadMap: false,
                hideMapIfNoMarkerAvailable: false,
                hideMapClass: 'd-none',
                callDefaultMapsMarkerSelectedUpdate: true,
                resetSelectionSelector: '.js-sg-estate-map-reset-selection',
                resetSelectionHiddenClass: 'd-none'
            }, options );

            // check for maps instances
            $mapContainer = $( settings.mapContainerSelector );
            if( $mapContainer.length > 0 )
            {
                // override settings of map w/ data attributes
                settings = $.extend( settings, $mapContainer.data() );
                // now check if maps module should be activated
                var $mapsTrigger = $( settings.mapTriggerSelector );
                if( $mapsTrigger.length > 0 && $mapsTrigger.hasClass( settings.mapTriggerClass ) )
                {
                    // extend settings via data attributes of trigger element
                    settings = $.extend( settings, $mapsTrigger.data() );

                    // ok, we should display the map w/ full functionality
                    // Only proceed if marker data is provided
                    // console.info("SGEstateMaps:init: markerData: %o, %o, %o", window.sgMarkerData, (typeof window.sgMarkerData == 'undefined'), (typeof window.sgMarkerData.markers == 'undefined') );
                    if( typeof window.sgMarkerData == 'undefined' || typeof window.sgMarkerData.markers == 'undefined' )
                    {
                        console.error('SGEstateMap.init: window.sgMarkerData does not exist or is not valid. No marker data found. Exiting.');
                        return;
                    }
                    // Only proceed if google.maps module is loaded
                    if (typeof google === 'object' && typeof google.maps === 'object' )
                    {
                        // set active state
                        app.active = true;
                        // copy marker into module
                        app.marker = window.sgMarkerData.markers;
                        if( app.marker.length > 0 ) {
                            // now show map if we should not lazy load it
                            if( settings.lazyLoadMap === false ) {
                                // now show map
                                app.showMap();
                            }
                        }
                        else if( settings.hideMapIfNoMarkerAvailable ) {
                            $mapContainer.addClass( settings.hideMapClass );
                        }

                    }
                    else
                    {
                        console.error('SGEstateMap.init: google.maps API not provided. Exiting.');
                    }
                }
            }

        };

        /**
         * Provide a source of visible immo UIds and hide all other map markers
         * accordingly
         * @param  {array} visibleUIds set of UIds that should stay visible
         */
        app.updateMarkerVisibility = function( visibleUIds )
        {
            if( app.active && mapVisible )
            {
                // check whether a marker id (.content) is in the set of
                // visibleUIds and set them to visible
                for( var i = 0; i < app.mapMarker.length; i++ )
                {
                    var skipNormalUpdate = false;
                    // if we have selection mode and this marker is selected
                    // we will skip the normal update mode and dont
                    // change the icon
                    if( settings.mode === 'selection' ) {
                        var index = getMarkerSelectedIndex( app.mapMarker[i] );
                        if( index > -1 ) {
                            skipNormalUpdate = true;
                        }
                    }

                    if( !skipNormalUpdate ) {
                        if( visibleUIds.indexOf( app.mapMarker[i].content ) >= 0 ) {
                            // should be visible
                            if( hasMarkerImage('hidden' ) ) {
                                app.mapMarker[i].setIcon( markerImages.default );
                            }
                            else {
                                app.mapMarker[i].setVisible( true );
                            }
                            app.mapMarker[i].setZIndex( settings.markerZIndex );
                        }
                        else {
                            // should be hidden
                            if( hasMarkerImage('hidden' ) ) {
                                app.mapMarker[i].setIcon( markerImages.hidden );
                            }
                            else {
                                app.mapMarker[i].setVisible( false );
                            }
                            app.mapMarker[i].setZIndex( settings.markerHiddenZIndex );
                        }
                    }
                }
            }
            lastFilterUids = visibleUIds;
        };

        /**
         *
         * @returns {boolean}
         */
        app.isMapVisible = function() {
            return mapVisible;
        };

        app.showMap = function() {
            if( app.active === true && mapVisible === false ) {
                // create map object
                initMap();
                // ser initial markers
                setMarker();
            }
        };

        /**
         * Initialize map object and forward styleobject
         */
        var initMap = function()
        {
            // map standard settings
            mapSettings = {
                zoom: 14,
                center: new google.maps.LatLng(0, 0),
                scrollwheel: false,
                draggable: !("ontouchend" in document),
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false
            };

            app.map = new google.maps.Map( $mapContainer[0], mapSettings );
            // add styles if mapStyles isset
            if( settings.mapStyles !== false )
            {
                var styledMap = new google.maps.StyledMapType( settings.mapStyles, {name: "Standard"});
                app.map.mapTypes.set("styled", styledMap );
                app.map.setMapTypeId("styled");
            }

            createMarkerImages();

            if( settings.mode === 'selection' ) {
                resetSelectionBtn = $( settings.resetSelectionSelector );
                resetSelectionBtn.on('click touch', onResetSelectionBtnClick);
                updateResetSelectionBtn();
            }

            mapVisible = true;
        };

        /**
         * Walk through all marker data and init gmaps marker w/ event listeners
         */
        var setMarker = function()
        {
            var bounds = new google.maps.LatLngBounds();
            for (var i = 0; i < app.marker.length; i++)
            {
                var myLatLng = new google.maps.LatLng( app.marker[i].latitude, app.marker[i].longitude );
                app.mapMarker[i] = new google.maps.Marker({
                    position: myLatLng,
                    map: app.map,
                    icon: markerImages.default,
                    animation: google.maps.Animation.DROP,
                    content: app.marker[i].uid,
                    html: app.marker[i].infowindow
                });
                bounds.extend( myLatLng );
            }

            // if we have multiple realties, lets maps fit the bounds
            // otherwise we want to have a certain zoom level
            if( app.mapMarker.length > 1 )
            {
                app.map.fitBounds( bounds );
            }
            else if( app.mapMarker.length > 0 )
            {
                app.map.setCenter( app.mapMarker[0].position );
            }

            // init marker info window
            if( settings.showInfoWindow )
            {
                infowindow = new google.maps.InfoWindow( {content: "Inhalt wird geladen..."} );
            }

            if( settings.markerHasOnClick || settings.mode === 'selection' )
            {
                for ( var j = 0; j < app.mapMarker.length; j++ )
                {
                    var thisMapMarker = app.mapMarker[j];
                    google.maps.event.addListener( thisMapMarker, 'click', function ()
                    {
                        if( settings.mode === 'selection' ) {
                            var index = getMarkerSelectedIndex( this );
                            if( index > -1 ) {
                                // was selected, so unselect
                                unselectSelectedMarkerByIndex( index, this );
                            }
                            else {
                                // not selected, push to selected
                                pushSelectedMarker( this );
                            }
                            triggerStandardMapsMarkerSelectedUpdate( getSelectedMarkerUids(), false );
                            updateResetSelectionBtn();
                        }
                        else if( typeof settings.markerOnClickCallbackOverride == 'function' )
                        {
                            // call callback and forward "this" context to function.
                            console.info( "SGEstateMap.markerOnClick: %o", this );
                            settings.markerOnClickCallbackOverride.apply( this );
                        }
                        else
                        {
                            // default on click event.
                            if( settings.showInfoWindow )
                            {
                                infowindow.setContent( this.html );
                                infowindow.open( app.map, this );
                            }
                        }
                    });
                }
            }
        };

        /**
         * Returns the index if marker is in selected list
         * @param marker
         * @returns {number}
         */
        var getMarkerSelectedIndex = function( marker ) {
            var r = -1;
            if( marker.content && marker.content > 0 ) {
                for( var i = 0; i < selectedMarker.length; i++ ) {
                    if( selectedMarker[i].content === marker.content ) {
                        r = i;
                        break;
                    }
                }
            }
            return r;
        }

        /**
         * Removes a certain map marker from the selected set and sets new icon
         * @param index
         * @param marker
         */
        var unselectSelectedMarkerByIndex = function( index, marker ) {
            if( index > -1 ) {
                selectedMarker.splice( index, 1 );
            }
            updateMarkerProps( marker, false );
        };

        /**
         * Adds a certain marker to the selected set
         * @param marker
         */
        var pushSelectedMarker = function( marker ) {
            selectedMarker.push( marker );
            updateMarkerProps( marker, true );
        };

        /**
         * Update marker props depending on its selected state
         * like icon and z-index
         * @param marker
         * @param selected
         */
        var updateMarkerProps = function( marker, selected ) {
            if( typeof selected === 'undefined' ) {
                selected = false;
            }

            if( hasMarkerImage('selected') ) {
                if( selected ) {
                    marker.setIcon( markerImages.selected );
                }
                else {
                    if( !isMarkerInLastFilter( marker ) && hasMarkerImage('hidden') ) {
                        marker.setIcon( markerImages.hidden );
                    }
                    else {
                        marker.setIcon( markerImages.default );
                    }
                }
            }

            if( selected ) {
                marker.setZIndex( settings.markerSelectedZIndex );
            }
            else {
                marker.setZIndex( settings.markerZIndex );
            }
        };

        /**
         * Get an array of all selected elements uids
         * @returns {[]}
         */
        var getSelectedMarkerUids = function() {
            var r = [];
            var selectedMarkerLength = selectedMarker.length;
            if( selectedMarkerLength > 0 ) {
                for( var i = 0; i < selectedMarkerLength; i++ ) {
                    r.push( selectedMarker[i].content );
                }
            }
            return r;
        };

        /**
         * Get an array of all selected elements uids
         * Public variant of internal getSelectedMarkerUIds
         * @returns {[]}
         */
        app.getSelectedMarkerUids = function() {
            var r = [];
            if( settings.mode === 'selection' ) {
                r = getSelectedMarkerUids();
            }
            return r;
        };

        /**
         * Checks whether the given marker is in the latest submitted
         * set of visible filter items, so we can decide which
         * icon the marker needs to have after it was deselected.
         * @param marker
         * @returns {boolean}
         */
        var isMarkerInLastFilter = function( marker ) {
            var r = false;
            if( lastFilterUids.length > 0 ) {
                if( lastFilterUids.indexOf( marker.content ) >= 0 ) {
                    r = true;
                }
            }
            return r;
        }

        /**
         * Hide all available map marker
         */
        var hideMapMarker = function()
        {
            if( app.active )
            {
                for( var i = 0; i < app.mapMarker.length; i++ )
                {
                    app.mapMarker[i].setVisible( false );
                }
            }
        };

        /**
         *  Create all needed marker images
         */
        var createMarkerImages = function() {
            markerImages.default = new google.maps.MarkerImage( settings.markerImagePath, new google.maps.Size(32, 32), new google.maps.Point(0,0), new google.maps.Point(0, 32));
            if( settings.markerHiddenImagePath !== false ) {
                markerImages.hidden = new google.maps.MarkerImage( settings.markerHiddenImagePath, new google.maps.Size(32, 32), new google.maps.Point(0,0), new google.maps.Point(0, 32));
            }
            if( settings.mode === 'selection' && settings.markerSelectedImagePath !== false ) {
                markerImages.selected = new google.maps.MarkerImage( settings.markerSelectedImagePath, new google.maps.Size(32, 32), new google.maps.Point(0,0), new google.maps.Point(0, 32));
            }
        };

        /**
         * Checks whether a certain type of marker image exists
         * @param type
         * @returns {boolean}
         */
        var hasMarkerImage = function( type ) {
            var r = false;
            if( typeof markerImages[ type ] !== 'undefined' ) {
                r = true;
            }
            return r;
        };

        var triggerStandardMapsMarkerSelectedUpdate = function( selection, updateMap ) {
            if( settings.callDefaultMapsMarkerSelectedUpdate &&
              typeof window.SGEstateFilter !== "undefined" &&
              window.SGEstateFilter.active )
            {
                window.SGEstateFilter.updateSelection( selection, updateMap );
            }
        };

        /**
         * Removes or adds the hidden class to reset selection btn
         */
        var updateResetSelectionBtn = function() {
            if( resetSelectionBtn.length > 0 ) {
                if( selectedMarker.length > 0 ) {
                    resetSelectionBtn.removeClass( settings.resetSelectionHiddenClass );
                }
                else {
                    resetSelectionBtn.addClass( settings.resetSelectionHiddenClass );
                }
            }
        };

        /**
         * On reset selection click removes all selected markers from the list and calls
         * the default maps marker selected update if applicable
         * @param e
         */
        var onResetSelectionBtnClick = function( e ) {
            e.preventDefault();
            var selectedMarkerLength = selectedMarker.length;
            if( selectedMarkerLength > 0 ) {
                for( var i = 0; i < selectedMarkerLength; i++ ) {
                    updateMarkerProps( selectedMarker[i], false );
                }
            }
            selectedMarker = [];
            triggerStandardMapsMarkerSelectedUpdate([], false );
            updateResetSelectionBtn();
        }

        return app;
    })();

})( jQuery );