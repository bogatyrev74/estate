/**
 * SGEstateBadge
 */
(function ($) {

  $.fn.SGEstateBadge = function (options) {
    var settings = $.extend({
      // the class we use to mark a badge as active. You may use this
      // for styling purposes. please keep in mind, that we also
      // use this class to select active badges
      activeClass: 'filter-badge--active',
      // allow multiple badges to be active
      multiple: true,
      // How do we access all other filter badges?
      // If multiple is set to false, which selector should we use to
      // deselect all active badges
      // We also use this selector to deselect active badges when a badge
      // with the keyword "all" was clicked to active or if
      // all other badges are deselected and all should be active
      baseSelector: '.js-filter-badge',
      // If you add a badge that should show all entries, use this
      // selector to make it reachable by this script or override it via the options
      allBadgeSelector: '.js-filter-badge-all',
    }, options)

    var onBadgeClick = function (e) {
      var $this = $(this)

      if (typeof SGEstateFilter !== 'undefined' && SGEstateFilter.active === true)
      {
        if ($this.data('active') === true)
        {
          this.sgfilter.lastValue = ''
          $this.removeClass(settings.activeClass)
          $this.data('active', false)

          // is any active? if not, activate "all" badge
          if( $('.'+settings.activeClass).length === 0) {
            activateAllBadge()
          }

        } else {

          this.sgfilter.lastValue = $this.data('value')

          // use the keyword "all" to disable filtering
          var allBadgeClicked = false
          if( this.sgfilter.lastValue === 'all' ) {
            this.sgfilter.lastValue = ''
            allBadgeClicked = true
          }

          if( settings.multiple ) {
            if( allBadgeClicked ) {
              deactivateAllOtherBadges()
            } else {
              deactivateAllBadge()
            }
          }
          else {
            deactivateAllBadges()
          }

          $this.addClass(settings.activeClass)
          $this.data('active', true)
        }

        SGEstateFilter.update()
        
        e.preventDefault()
      }
    }

    var activateAllBadge = function() {
      $(settings.allBadgeSelector).addClass(settings.activeClass).data('active', true)
    }

    var deactivateAllBadge = function() {
      $(settings.allBadgeSelector).removeClass(settings.activeClass).data('active', false)
    }

    var deactivateAllOtherBadges = function() {
      $('.'+settings.activeClass).not(settings.allBadgeSelector).each( function() {
        $(this).removeClass(settings.activeClass).data('active', false)
        this.sgfilter.lastValue = ''
      })
    }

    var deactivateAllBadges = function() {
      $('.'+settings.activeClass).each( function() {
        $(this).removeClass(settings.activeClass).data('active', false)
        this.sgfilter.lastValue = ''
      })
    }

    return this.each(function () {
      var $this = $(this)

      settings = $.extend(settings, $this.data())

      if (typeof SGEstateFilter !== 'undefined')
      {
        if (typeof $this.data('value') === 'undefined')
        {
          $this.data('value', '')
        }

        $this.data('active', false)

        this.sgfilter = {
          dimensionType: 'badge',
          direction: '',
          operator: 'or',
          lastValue: '',
          attribute: 'class'
        }
      }

      $this.on('click', onBadgeClick)

      // if this is the "all" badge, activate it by default
      if( $this.filter(settings.allBadgeSelector).length > 0 ) {
        $this.addClass(settings.activeClass).data('active', true)
      }

      return $this
    })
  };
})(jQuery);