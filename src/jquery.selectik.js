// Copyright (c) 2012 Ivan Kubrakov 
// Selectik: a jQuery custom select plugin http://brankub.github.com/selectik/

(function($) {
	// global variables
	var openList = false;
	var selectControl = false;
	var trigger = false;
	
	$.selectik = function(element, options) {
		// global variables for this instance of plugin
		var count, standardTop, heightItem, heightContainer, disabled, heightList, heightShift, relating, heightScroll, scrollL = false, change = false, settings;
		// global variables for this instance of plugin (objects)
		var $listContainer, $list, $options, $text, $scroll, $container, $bgScroll, $selected;

        // private method: plugin's default options
        var _defaults = {
            containerClass: 'custom-select',
            width: 0,
            maxItems: 0,
            customScroll: 1,
            speedAnimation:200
        };

		var selectik = this;
        selectik.settings = {};
        var $cselect = $(element),
             cselect = element;

		selectik.init = function() {
			// merged properties
			settings = $.extend({}, _defaults, options);
			//Check select width
			//Select width is inconsistent in different browser,
			//so we wrap select by inline element and get it's width
			if( settings.width == 0 ) {
			    $cselect.wrap('<span/>');
			    settings.width = $cselect.parent().width();
			    $cselect.parent().replaceWith( $cselect );
			}
			// fire start functions
			_getHtml();
			_handlers();
		};

		// private method: wrap selects in divs and fire html generator
		var _getHtml = function() {
			$cselect.wrap('<div class="'+settings.containerClass+'"></div>');
			$container = $cselect.parent();
			_getList({ refreshSelect: false });
		};

		// private method: list html
		var _getList = function(e){
			count = cselect.length;
			if (e.refreshSelect){ $('ul', $container).remove(); }

			// recursion html
			var html = (function recur($element) {
				var html = '',
				    $collection = $element.children();

				for (var i = 0; i < $collection.length; i++){
					var $this = $($collection[i]);
					if ( $this.prop("tagName") == "OPTION" ) {
						disabled = ($this.attr('disabled') === 'disabled') ? 'disabled' : '';
						var textOption = $this[0].text;
						var valueOption = $this[0].value;
						html += '<li class="'+disabled+'"><a data-value="'+valueOption+'">'+textOption+'</a></li>';
					} else if ( $this.prop("tagName") == "OPTGROUP" ) {
						disabled = ($this.attr('disabled') === 'disabled') ? ' disabled' : '';
						var textOption = $this.attr('label');
						html += '<li class="optgroup'+disabled+'"><span>'+textOption+'</span><ul>' + recur($this) + '</ul></li>';
					}
				}
				return html;
			})($cselect);

			// html for control
			var scrollHtml = (settings.maxItems > 0 && settings.customScroll == 1) ? '<div class="select-scroll"><span class="scroll-drag"><!-- --></span></div>' : '';
			var scrollClass = (settings.customScroll == 1) ? 'custom-scroll' : 'default-scroll';

			// selected
			$selected = $('option:selected', $cselect);

			// check if first time or refresh
			if (e.refreshSelect){
				html = '<ul>'+html+'</ul>';
				$(html).prependTo($('.select-list', $container));
			}else{
				html = '<span class="custom-text">'+$selected[0].text+'</span><div class="select-list '+scrollClass+'">'+scrollHtml+'<ul>'+html+'</ul></div>';
				$(html).prependTo($container);
			}

			$list = $('ul', $container);
			$options = $('a[data-value]',$list);
			$text = $('.custom-text', $container);
			$listContainer = $('.select-list', $container);
			_clickHandler();
			$options.eq($selected.index()).parent().addClass('selected');

			// give width to elements
			$container.removeClass('done');

			selectik.setWidthCS(settings.width);
			standardTop = parseInt($listContainer.css('top'));


			// fire function for max length
			_getLength({refreshSelect: e.refreshSelect });
		};

		var _getLength = function(e){
			if (!e.refreshSelect){ heightItem = $('li:nth-child(1)', $list).outerHeight(); }

			// check if count of options more then max
		  	if (count < settings.maxItems || settings.maxItems == 0) { $listContainer.hide(); $container.addClass('done'); return; }
			scrollL = true;
           	heightList = heightItem*count;
			heightContainer = heightItem*settings.maxItems;

			// put height for list
			$list.css('height', heightContainer);
			$listContainer.hide();
			$container.addClass('done');
			if (settings.customScroll == 1) {  _getScroll(); }
		};

		// private method: custom scroll
		var _getScroll = function(){
			var allHeight = heightItem*count;
			heightShift = -allHeight+heightContainer;
			$bgScroll = $('.select-scroll', $listContainer);
			$bgScroll.css('height', heightContainer);
			$scroll = $('.scroll-drag', $listContainer);
			$listContainer.addClass('maxlength');

			// calculate relate of heights
			relating = allHeight / heightContainer;

			// height of scroll
			heightScroll = heightContainer*(heightContainer / allHeight);
			$scroll.css('height', heightScroll);

			// if selected
			if ($('.selected', $list).length > 0){
				_shift($('.selected', $list).index());
			}
			if (settings.customScroll){ _scrollHandlers(); }
		};

		var _scrollHandlers = function(){
            var shiftL;
			// bind mousewheel
			$list.bind('mousewheel', function(event, deltaY) {
				shiftL = parseInt($list.css('top'))+(deltaY*heightItem);
				_shiftHelper(shiftL);
				return false;
			});

			// bind click on scroll background
			$bgScroll.click(function(e){
				var direction = (((e.pageY - $(this).offset().top)/heightContainer) > 0.5) ? -1 : 1;
				shiftL = parseInt($list.css('top')) + (heightItem * direction);
				_shiftHelper(shiftL);
				return false;
			});

			// draggable handler and calculate
	        $scroll.on('mousedown', function(e){ _draggable(e, true); });
			$(document).on('mouseup', function(e){ _draggable(e, false); });
		};

		// private method: draggable for scroll
		var _draggable = function(e, on){
			if (on){
				if (e.preventDefault()) { e.preventDefault(); }
				var startPosition = parseInt($scroll.css('top'));
				var helper = e.clientY;
				$(document).bind('mousemove', function(e){
					var newPosition = (helper - e.clientY) - startPosition;
					_shiftHelper(newPosition*relating);
				});
			}else{
				$(document).unbind('mousemove');
					openList = true;
				}
		};

		// private method: shift
		var _shiftHelper = function (e){
			e = (e > 0) ? 0 : e;
			e = (e < heightShift) ? heightShift: e;
			$list.css('top', e);
			$scroll.css('top', -e/relating);
		};

		// private method: shift conrtol
		var _shift = function(indexEl){
			if (indexEl < 0 || indexEl == count) { return; }
			var topShift = (indexEl > count-settings.maxItems) ? heightList-heightContainer : heightItem*indexEl;
			$('.selected', $list).removeClass('selected');
			$options.eq(indexEl+1).parent().addClass('selected');
			if (openList && selectControl){
				$text.text($options.eq(indexEl-1).data('value'));
			}
			if (!scrollL) { return; }
			_shiftHelper(-topShift);
		};
		
		// private method: click on li
		var _clickHandler = function(){
			$listContainer.on('mousedown', 'a', function(){
				 if ($(this).parents("li.disabled").length > 0) { return false; }
				_changeSelected($(this));
			});	
		}

		// private method: handlers
		var _handlers = function(){
			// reset button
			var $reset = $('input[type="reset"]', $cselect.parents('form'));
			if ($reset.length > 0){
				$reset.bind('click', function(){
					var element = ($selected.length > 0) ? $selected : $('option', $cselect).first();
					_changeSelected(element);
				});
			}

			// change on original select
			$cselect.bind('change', function(){
				 if (change) { change = false; return false; }
				_changeSelected($('option:selected', $(this)));
			});

			// click on select
			$text.bind('click', function(){
				if( $container.hasClass('disable')) { return false; }
				$cselect.focus();
				_fadeList($listContainer, false, true);
			});

			// active class
			$cselect.bind('focus', function(){
				$container.addClass('active');
			});
			$cselect.bind('blur', function(){
				$container.removeClass('active');
				if (openList){
					selectik.hideCS();
					$cselect.parent().removeClass('active');
				}
			});

			$cselect.bind('keyup', function(e) { _keysHandlers(e); });
			if ($.browser.opera){
				$cselect.bind('keydown', function() { trigger = true; });
			};
		};

        // private method: handlers on keys
        var _keysHandlers = function(e){
            if (e.keyCode == 13 && $listContainer.is(':visible')) { _fadeList($listContainer, true, false); }
            if (!$.browser.msie){
                if (e.keyCode == 27 && $listContainer.is(':visible')) { _fadeList($listContainer, true, true); }
            }
            $cselect.change();
            if (scrollL) { _shift($('option:selected', $cselect).index()); }
        };

		// private method: change selected
		var _changeSelected = function(e){
			var dataValue = (e.parents('select').length > 0) ? e.attr('value') : e.data('value');
			var index = (e.parents('select').length > 0) ? e.index() : e.parent().index();
			var textValue = e.text();
			_changeSelectedHtml(dataValue, textValue, index);
		};

		// private method: change selected
		var _changeSelectedHtml = function(dataValue, textValue, index){
			//input[type=reset] may give index 0
			if (index > count || index < 0) { return false;}
			change = true;
			$cselect.attr('value', dataValue).change();
			$('.selected', $list).removeClass('selected');
			$options.eq(index).parent().addClass('selected');
			$text.text(textValue);
		};

		// private method: show/hdie list
		var _fadeList = function(e, out, text){
			if ($('.'+settings.containerClass+'.open_list').length == 1){
				$('.'+settings.containerClass+'.open_list').children('select').data('selectik').hideCS();	
			}			
            if (!text){
                $('.'+settings.containerClass+'.open_list').children('.select-list').stop(true, true).fadeOut(settings.speedAnimation).parent().toggleClass('open_list');
                if (out){ return; }
            }
			openList = false;
			selectik.positionCS(e);
			e.stop(true, true).fadeToggle(settings.speedAnimation);
			e.parent().toggleClass('open_list');
			setTimeout(function(){ openList = true; }, settings.speedAnimation);
		};

		// public method: hide list
		selectik.hideCS = function(){
			$listContainer.fadeOut(settings.speedAnimation);
			$container.removeClass('open_list');
            $cselect.focus();
			openList = true;
		};

		// public method: show list
		selectik.showCS = function(){
			openList = false;
			$listContainer.fadeIn(settings.speedAnimation);
			$container.addClass('open_list');
		};

		// public method: postion of list
		selectik.positionCS = function(e){
			elParent = e.parent();
			var heightPosition = (scrollL) ? settings.maxItems*heightItem : count*heightItem;
			var quaItems = (scrollL) ? settings.maxItems : count;
			var topPosition = ($(window).outerHeight() - (elParent.offset().top - $(window).scrollTop()) - elParent.outerHeight() < heightPosition) ? -quaItems*heightItem-(elParent.outerHeight()/4) : standardTop;
			topPosition = ((elParent.offset().top - $(window).scrollTop()) < heightPosition) ? standardTop : topPosition;
			e.css('top', topPosition);
		};

		// public method: refresh list
		selectik.refreshCS = function() {
            _getList({ refreshSelect: true });
	    };

		// public method: change active element
		selectik.changeCS = function(val) {
			var index = (val.index > 0) ? val.index : $('option[value="'+val.value+'"]', $cselect).index()+1;
			var dataValue = $('option:nth-child('+(index)+')', $cselect).attr('value');
			var textValue = $('option:nth-child('+(index)+')', $cselect).text()
			_changeSelectedHtml(dataValue, textValue, index);
		};

		// public method: disable list
		selectik.disableCS = function(){
			$cselect.attr('disabled', true);
			$container.addClass('disable');
		};

		// public method: enable list
		selectik.enableCS = function(){
			$cselect.attr('disabled', false);
			$container.removeClass('disable');
		};

        // public method: required
        selectik.requiredCS = function(){
            $text.toggleClass('required');
        };

		// public method: width of select
		selectik.setWidthCS = function(width){
			//Paddings may has element or/and it's parent
			$.each([$list,$text],function() {
				var $parent   = $(this).parent(),
				parentPaddings  = $parent.outerWidth() - $parent.width(),
				elementPaddings = $(this).outerWidth() - $(this).width(),
				paddings = parentPaddings + elementPaddings;
				$(this).css('width', width - paddings);
			});
		};
		selectik.init();
	};

	$.fn.selectik = function(options) {
        return this.each(function() {
            if ($(this).attr('multiple') == 'multiple') { return; }
            if (undefined == $(this).data('selectik')) {
                // create a new instance of the plugin
                var selectik = new $.selectik(this, options);
                $(this).data('selectik', selectik);
            }
        });
    };
	
	// global handlers
	$(window).resize(function(){
        if (openList){
            if (!$('.open_list').length > 0) { return; }
            $('.open_list').children('select').data('selectik').positionCS($('.select-list:visible'));
        }
	});
	$(document).bind('click', function(){
		if (trigger) { trigger = false; return; }
		if (openList){
			openList = false;
			if ($('.open_list').length > 0){
				$('.open_list').children('select').data('selectik').hideCS();
			}
		}
	});

})(jQuery);