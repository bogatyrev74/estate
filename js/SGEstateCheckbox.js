/**
 * SGEstateCheckbox
 *
 * Form type for isotope filtered estate search based on checkbox values.
 * Wraps all checkbox elements w/ meta info. This element may be registered as
 * checkbox to SGEstateFilter
 *
 * @package SGEstateFilter
 *
 * Markup: Use custom selector and trigger $('').SGEstateCheckbox({}); function
 *
 * For further customization you may override onChange callback in settings/options
 *
 */
(function( $ ) {

  $.fn.SGEstateCheckbox = function( options ) {
    var settings = $.extend({
      onChange: function( $this, filterValue ) {
        // Triggers SGEstateFilter update by default.
        // Override onChange callback if you need further customization
        if( typeof window.SGEstateFilter !== 'undefined' && window.SGEstateFilter.active === true ) {
          window.SGEstateFilter.update();
        }
      }
    }, options );

    /**
     * Returns the css filter string for isotope filter
     * @param {jQuery} $thisCheckbox
     * @return {string}
     */
    var evalValue = function( $thisCheckbox ) {
      if( $thisCheckbox.prop('checked') === true ) {
        // return value (should be css selector) if checked
        return $thisCheckbox.val();
      }
      else {
        // return nothing, no evaluation for this one
        return '';
      }
    };

    /**
     * Will be triggered everytime the checkbox changes. Eventually triggers onChange
     * defined in settings and provides $this and the filtered value
     * @param e
     */
    var onCheckboxChange = function( e ) {
      var $this = $( this );
      if( typeof settings.onChange === 'function' ) {
        this.sgfilter.lastValue = evalValue( $this );
        settings.onChange( $this, this.sgfilter.lastValue );
      }
    };


    return this.each( function()
    {
      var $this = $(this);
      // initially write value to all fields,
      // but only if checkbox is checked
      var thisValue = '';
      if( $this.prop('checked') === true ) {
        thisValue = $this.val();
      }

      if( window.SGEstateFilter )
      {
        this.sgfilter = {
          dimensionType: 'checkbox',
          direction: '',
          operator: 'and',
          lastValue: thisValue,
          attribute: 'class'
        };
      }

      $this.on('change', onCheckboxChange );

      return $this;
    });
  };

}( jQuery ));