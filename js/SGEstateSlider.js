/**
 * SGEstateSlider
 *
 * Form type for isotope filtered estate search based on slider values.
 * Wraps all slider elements w/ meta info. This element may be registered as
 * slider to SGEstateFilter
 * 
 * @package SGEstateFilter
 *
 * Markup:
 *
 * The slider:
 * - data-value: Initial slider value
 * - data-range: "max | "min". Determines which end of the slider is filled. Refers to the selected value, als the max or min value.
 * - data-min: minimum slider range
 * - data-max: max slider range
 * - data-input-id: id w/ "#" that refers to the input field that should receive the current slider value.
 * - data-display-id: id w/ "#" that referns to the element that shoudl display the value to the user.
 * - data-sgfilter-attribute: If sliders are used for live filtering w/ SGEFilter, you have to provide the name of the corresponding data field of the filterable elements.
 * 
 * <div id="flatSizeMinSlider" class="sgestate-filter-slider" data-value="50" data-range="max" data-min="30" data-max="120" data-input-id="#flatSizeMinField" data-display-id="#flatSizeMinDisplay" data-sgfilter-attribute="size"></div>
 *
 * The input fields and value displays:
 * <label for="flatSizeMinField" name="flat-size-field">Wohnungsfläche ab <span id="flatSizeMinDisplay" class="fs-data-display">45</span>m²</label>
 * <input type="text" id="flatSizeMinField" name="flat-size-min-field" class="fs-field" readonly>
 */
(function( $ ) {

    $.fn.SGEstateSlider = function( options ) {
        var settings = $.extend({}, options );
        return this.each( function()
        {
            var $this = $(this);

            if($this.data("range") === true) {


                var sliderOptions = {
                    range: true,
                    min: parseFloat($this.data("min")),
                    max: parseFloat($this.data("max")),
                    values: [parseFloat($this.data("value")), parseFloat($this.data("max"))],
                    slide: function (event, ui) {
                        var $thisSlider = $(this);
                        // write value to input field
                        if ($thisSlider.data("input-id")) {
                            $($thisSlider.data("input-id")).val(ui.values[0] === ui.values[1] ? ui.values[0] : ui.values[0] + " - " + ui.values[1]);
                        }
                        // write value to UI display field (span)
                        if ($thisSlider.data("display-id")) {
                            $($thisSlider.data("display-id")).html(ui.values[0] === ui.values[1] ? ui.values[0] : ui.values[0] + " - " + ui.values[1]);
                        }

                        // read slider mode and update modules accordingly
                        if ($thisSlider.data('mode')) {
                            if ($thisSlider.data('mode') == 'live') {

                                if (typeof window.SGEstateLiveFilter !== 'undefined' && window.SGEstateLiveFilter.active === true) {
                                    this.sgfilter.firstValue = parseFloat(ui.values[0]);
                                    this.sgfilter.lastValue = parseFloat(ui.values[1]);
                                    window.SGEstateLiveFilter.update();
                                }
                            } else if ($thisSlider.data('mode') == 'filter') {

                                if (typeof window.SGEstateFilter !== 'undefined' && window.SGEstateFilter.active === true) {
                                    this.sgfilter.firstValue = parseFloat(ui.values[0]);
                                    this.sgfilter.lastValue = parseFloat(ui.values[1]);
                                    window.SGEstateFilter.update();
                                }
                            }
                        } else {

                            // update sgfilter stuff if module isset
                            if (typeof window.SGEstateFilter !== 'undefined' && window.SGEstateFilter.active === true) {
                                this.sgfilter.firstValue = parseFloat(ui.values[0]);
                                this.sgfilter.lastValue = parseFloat(ui.values[1]);
                                window.SGEstateFilter.update();
                            }
                        }
                    }
                };


            } else {

                var sliderOptions = {
                    range: $this.data("range"),
                    min: parseFloat($this.data("min")),
                    max: parseFloat($this.data("max")),
                    value: parseFloat($this.data("value")),
                    slide: function (event, ui) {
                        var $thisSlider = $(this);
                        // write value to input field
                        if ($thisSlider.data("input-id")) {
                            $($thisSlider.data("input-id")).val(ui.value);
                        }
                        // write value to UI display field (span)
                        if ($thisSlider.data("display-id")) {
                            $($thisSlider.data("display-id")).html(ui.value);
                        }

                        // read slider mode and update modules accordingly
                        if ($thisSlider.data('mode')) {
                            if ($thisSlider.data('mode') == 'live') {
                                if (typeof window.SGEstateLiveFilter !== 'undefined' && window.SGEstateLiveFilter.active === true) {
                                    this.sgfilter.lastValue = parseFloat(ui.value);
                                    window.SGEstateLiveFilter.update();
                                }
                            } else if ($thisSlider.data('mode') == 'filter') {
                                if (typeof window.SGEstateFilter !== 'undefined' && window.SGEstateFilter.active === true) {
                                    this.sgfilter.lastValue = parseFloat(ui.value);
                                    window.SGEstateFilter.update();
                                }
                            }
                        } else {
                            // update sgfilter stuff if module isset
                            if (typeof window.SGEstateFilter !== 'undefined' && window.SGEstateFilter.active === true) {
                                this.sgfilter.lastValue = parseFloat(ui.value);
                                window.SGEstateFilter.update();
                            }
                        }
                    }
                };
            }
            $this.slider( sliderOptions );
            // initially write value to all fields
            var thisValue = $this.slider("value");

            if( window.SGEstateFilter )
            {
                var attribute = false;
                if( $this.data("sgfilter-attribute") )
                {
                    attribute = $this.data("sgfilter-attribute");
                }
                this.sgfilter = {
                    dimensionType: "slider",
                    direction: $this.data("range"),
                    operator: "and",
                    lastValue: thisValue,
                    attribute: attribute
                };
            }
            

            $this.val( thisValue );
            // write value to input field
            if( $this.data("input-id") )
            {
                $( $this.data("input-id") ).val( thisValue );
            }
            // write value to UI display field (span)
            if( $this.data("display-id") )
            {
                $( $this.data("display-id") ).html( thisValue );
            }

            return $this;
        });
    };

}( jQuery ));