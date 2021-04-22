/**
 * SGEstateMegaselect
 *
 * Adds a megaselect with autocomplete and deselect functionality
 * for items that should be filtered by css selectors.
 * Uses SGAutocomplete.
 *
 * @package SGEstateMegaselect
 *
 * Initialization:
 * Use window.SGEstateMegaselect.init() to run.
 * If you use it insite SGEstateFilter, use
 * megaselect: window.SGEstateMegaselect.init({}),
 * inside items.
 *
 * Provide your list of places via:
 * window.SGEstateMegaselectItems = []; </script>
 *
 * Items should have the following fields: id, name, type, selector
 * where type should be something user defined or just be a generic default
 * if you do not differentiate between types.
 *
 * Example Markup with SGAutocomplete markup:
 * <div class="js-sge-megaselect">
 *   <div class="sge-megaselect-reset-filter js-sge-megaselect-reset-filter">Filter entfernen</div>
 *   <div class="sge-megaselect-selected-holder js-sge-megaselect-selected-holder"></div>
 *   <div class="js-sg-autocomplete-group-trigger sg-autocomplete-holder">
 *     <input type="text" name="autocomplete" class="form-control" />
 *     <div class="sg-autocomplete-list js-sg-autocomplete-list"></div>
 *   </div>
 * </div>
 *
 */
window.SGEstateMegaselect = ( function() {

  var _init = false;
  var settings = {
    triggerSelector: '.js-sge-megaselect',
    resetFilterSelector: '.js-sge-megaselect-reset-filter',
    resetFilterActiveClass: 'sge-megaselect-reset-filter--active',
    selectedHolderSelector: '.js-sge-megaselect-selected-holder',
    selectedHolderActiveClass: 'sge-megaselect-selected-holder--active',
    selectedItemClass: 'sge-megaselect-selected',
    selectedItemSelector: '.js-sge-megaselect-selected',
    /**
     * If you want to override the default behavior use this callback with arguments
     * value, $container, $this
     */
    autocompleteRequestCallback: false,
    /**
     * If you want to override the default behavior use this callback with argument
     * item
     */
    autocompleteRequestEachItemCallback: false,
    /**
     * If you want to override the default behavior use this callback with arguments
     * value, $item, $container, $input, $list
     */
    autocompleteOnSelectCallback: false,
    /**
     * Callback that notifies you when an element was selected
     * item
     */
    autocompleteAdditionalOnSelectCallback: false,
    /**
     * Callback that notifies you when an element was deselected
     * item
     */
    autocompleteAdditionalOnDeselectCallback: false,
  };
  var $trigger = false;
  var $resetFilterHolder = false;
  var $selectedHolder = false;
  var items = false;
  var selectedItems = [];
  var app = {};

  app.init = function( options ) {
    if( _init ) { return; }
    _init = true;

    settings = $.extend( settings, options );
    $trigger = $( settings.triggerSelector );
    if( $trigger.length > 0 ) {
      if( typeof window.SGEstateMegaselectItems !== 'undefined' ) {
        items = window.SGEstateMegaselectItems;
      }

      if( items.length > 0 ) {
        // initializes the autocomplete
        // @todo provide a way to configure SGAutocomplete settings
        window.SGAutocomplete.init({
          requestCallback: autocompleteRequestCallback,
          requestEachItemCallback: autocompleteRequestEachItemCallback,
          onSelectCallback: autocompleteOnSelectCallback,
          clearInputOnSelect: false,
          hideListOnSelect: false,
        });

        $resetFilterHolder = $( settings.resetFilterSelector );
        $resetFilterHolder.on('click', onResetFilterClick );

        $selectedHolder = $( settings.selectedHolderSelector );

        $(document).on('click touch', settings.selectedItemSelector, onSelectedItemClick );
      }
    }

    return app;
  };

  /**
   * Updates the megaselect views (no logic) and sends an update
   * trigger to SGEstateFilter if present
   */
  app.update = function() {
    maybeUpdateEstateFilter();
    if( selectedItems.length > 0 ) {
      $resetFilterHolder.addClass( settings.resetFilterActiveClass );
      $selectedHolder.addClass(settings.selectedHolderActiveClass);
    }
    else {
      $resetFilterHolder.removeClass( settings.resetFilterActiveClass );
      $selectedHolder.removeClass(settings.selectedHolderActiveClass);
    }
  };

  /**
   * Get all selected items.
   * @returns {[]}
   */
  app.getSelectedItems = function() {
    return selectedItems;
  };

  /**
   * Check whether there is any selected item
   * @returns {boolean}
   */
  app.hasSelectedItems = function() {
    return selectedItems.length > 0;
  };

  /**
   * combined selector is a huge selector that contains all
   * selectors of all selected items separated by comma
   * only OR connection until now
   * @returns {string}
   */
  app.getCombinedSelector = function() {
    var r = '';
    $.each( selectedItems, function( index, element ) {
      if( index > 0 ) {
        r += ', ';
      }
      r += element.selector;
    });
    return r;
  }

  /**
   * Triggers the requestCallback function of SGAutocomplete
   * @param value
   * @param $container
   * @param $this
   * @returns {[]}
   */
  var autocompleteRequestCallback = function( value, $container, $this ) {
    if( typeof settings.autocompleteRequestCallback === "function" ) {
      return settings.autocompleteRequestCallback( value, $container, $this );
    }
    else {
      var selectedItems = [];
      // make it lowercase so we can compare case insensitive
      var compareValue = value.toLowerCase();
      $.each( items, function() {
        if( this.name.toLowerCase().indexOf( compareValue ) > -1 ) {
          selectedItems.push( this );
        }
      });
      return selectedItems;
    }
  };

  /**
   * Triggers the requestEachItemCallback function of SGAutocomplete
   * @param item
   * @returns {string}
   */
  var autocompleteRequestEachItemCallback = function( item ) {
    if( typeof settings.autocompleteRequestEachItemCallback === "function" ) {
      return settings.autocompleteRequestEachItemCallback( item );
    }
    else {
      var itemAddClass = '';
      if( inSelectedItems( item.id ) > -1 ) {
        itemAddClass = ' sg-autocomplete-item--selected';
      }
      var realName = item.name;
      if( item.type === 'district' && realName.indexOf(' - ') !== -1) {
        realName = realName.split(' - ')[1];
      }
      html = '<div class="sg-autocomplete-item'+itemAddClass+' sg-autocomplete-item--type-'+item.type+' js-sg-autocomplete-item" data-value="'+item.id+'" data-name="'+item.name+'" data-real-name="'+realName+'" data-type="'+item.type+'">';
      var typeName = 'Stadt';
      if( item.type === 'region' ) {
        typeName = 'Region';
      }
      else if( item.type === 'district' ) {
        typeName = 'Stadtteil';
      }
      html += '<span class="sg-autocomplete-item-inner"><span class="sg-autocomplete-item-type">'+typeName+':</span>'+item.name+'</span>';
      html += '<i class="far fa-times sg-autocomplete-item-icon"></i>';
      html += '</div>';
      return html;
    }
  };

  /**
   * Triggers the onSelectCallback function of SGAutocomplete
   * @param value
   * @param $item
   * @param $container
   * @param $input
   * @param $list
   */
  var autocompleteOnSelectCallback = function( value, $item, $container, $input, $list ) {
    if( typeof settings.autocompleteOnSelectCallback === "function" ) {
      settings.autocompleteOnSelectCallback( value, $item, $container, $input, $list );
    }
    else {
      // deselect if it was already selected.
      var inSelectedItemsIndex = inSelectedItems( value );
      if( inSelectedItemsIndex > -1 ) {
        selectedItems.splice( inSelectedItemsIndex, 1 );
        var $legendItem = getSelectedItemById( value );
        if( $legendItem !== false ) {
          $legendItem.remove();
        }
        $item.removeClass('sg-autocomplete-item--selected');

        if( typeof settings.autocompleteAdditionalOnDeselectCallback === 'function') {
          settings.autocompleteAdditionalOnDeselectCallback({
            name: $item.data('name'),
            realName: $item.data('realName'),
            type: $item.data('type'),
            value: $item.data('value')
          });
        }
      }
      else {
        // otherwise select
        $.each( items, function() {
          if( this.id === value ) {
            selectedItems.push( this );
            addSelectedItemToHolder( this );

            if( typeof settings.autocompleteAdditionalOnSelectCallback === 'function') {
              settings.autocompleteAdditionalOnSelectCallback({
                name: $item.data('name'),
                realName: $item.data('realName'),
                type: $item.data('type'),
                value: $item.data('value')
              });
            }

          }
        });
        // remove this item, so the user won't reselect it
        $item.addClass('sg-autocomplete-item--selected');
      }
      // @todo hide list if no item is available
      app.update();
    }
  };

  /**
   * Add markup for one given item to the selected items holder
   * @param item
   */
  var addSelectedItemToHolder = function( item ) {
    var realName = item.name;
    if( item.type === 'district' && realName.indexOf(' - ') !== -1) {
      realName = realName.split(' - ')[1];
    }
    // @todo mark if it was already selected
    var html = '<span class="js-sge-megaselect-selected '+settings.selectedItemClass+' '+settings.selectedItemClass+'--'+item.type+'" data-value="'+item.id+'" data-name="'+item.name+'" data-real-name="'+realName+'" data-type="'+item.type+'"><span>'+item.name+'</span><i class="far fa-times"></i></span>';
    $selectedHolder.append( html );
  };

  /**
   * Returns the selectedItem of the selectedItems holder if the id is
   * present. Otherwise false.
   * @param id
   * @returns {boolean|jQuery}
   */
  var getSelectedItemById = function( id ) {
    var r = false;
    $selectedHolder.find('.js-sge-megaselect-selected').each( function(){
      var $this = $(this);
      if( $this.data('value') === id ) {
        r = $this;
      }
    });
    return r;
  };

  /**
   * Will be triggered when an item of the selected items holder was
   * clicked an thus will be removed from the set of selectedItems
   * @param e
   */
  var onSelectedItemClick = function( e ) {
    var $this = $(this);
    var selectedItemIndex = inSelectedItems( $this.data('value') );
    if( selectedItemIndex > -1 ) {

      if( typeof settings.autocompleteAdditionalOnDeselectCallback === 'function') {
        settings.autocompleteAdditionalOnDeselectCallback({
          name: $this.data('name'),
          realName: $this.data('realName'),
          type: $this.data('type'),
          value: $this.data('value')
        });
      }

      selectedItems.splice( selectedItemIndex, 1 );
      $this.remove();
      app.update();
    }
  };

  /**
   * Will be triggered on reset filter click and removes all
   * items from selectedItems and updates the views
   * @param e
   */
  var onResetFilterClick = function( e ) {
    // fire deselect callback for each available item
    $(settings.selectedItemSelector).each(function(){
      var $this = $(this);
      var selectedItemIndex = inSelectedItems( $this.data('value') );
      if( selectedItemIndex > -1 ) {
        if( typeof settings.autocompleteAdditionalOnDeselectCallback === 'function') {
          settings.autocompleteAdditionalOnDeselectCallback({
            name: $this.data('name'),
            realName: $this.data('realName'),
            type: $this.data('type'),
            value: $this.data('value')
          });
        }
      }
    });
    selectedItems = [];
    $selectedHolder.html('');
    app.update();
  };

  /**
   * Check whether a given id is already in the list of selectedItems
   * Returns the index if present or -1 if not.
   * @param id
   * @returns {number}
   */
  var inSelectedItems = function( id ) {
    var r = -1;
    $.each( selectedItems, function( index, element ) {
      if( element.id === id ) {
        r = index;
      }
    })
    return r;
  };

  /**
   * Triggers an update for SGEstateFilter if module is present and was initialized
   */
  var maybeUpdateEstateFilter = function() {
    if( typeof window.SGEstateFilter !== 'undefined' && window.SGEstateFilter.active === true ) {
      window.SGEstateFilter.update();
    }
  };

  return app;

})();