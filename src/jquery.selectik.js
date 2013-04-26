// Copyright (c) 2012 Ivan Kubrakov 
// Selectik a jQuery custom select plugin http://brankub.github.com/selectik/

(function($) {
	// global variables
	var openList = false;
	var selectControl = false;
	var trigger = false;
	var mouseTrigger = false;
	var isMobile = (/android|iphone|ipad|ipod|android/i.test(navigator.userAgent.toLowerCase()));
	var isOpera = (/opera/i.test(navigator.userAgent.toLowerCase()));
	var isIE = (/msie/i.test(navigator.userAgent.toLowerCase()));
	var isOperaMini  = Object.prototype.toString.call(window.operamini) === "[object OperaMini]";
	
	Selectik = function(options){
		// merge options
        this.config = $.extend(true, {
			containerClass: 'custom-select',
            width: 0,
            maxItems: 0,
            customScroll: 1,
            speedAnimation:200,
			smartPosition: true
        }, options || {});
    };	
	
    Selectik.prototype = {
        _init: function(element){
			this.$cselect = $(element);
            this.cselect = element;
			this.scrollL = false;
			this.change = false;
			
			//Check select width
			//Select width is inconsistent in different browser,
			//so we wrap select by inline element and get it's width
			if( this.config.width == 0 ) {
			    this.$cselect.wrap('<span/>');
			    this.config.width = this.$cselect.parent().width();
			    this.$cselect.parent().replaceWith( this.$cselect );
			}
			
			this._generateContainer();
			this._handlers();
		},
		// private method: wrap selects in divs and fire html generator
		_generateContainer: function(){
			this.$cselect.wrap('<div class="'+this.config.containerClass + (this.$cselect.attr('disabled') === 'disabled' ? ' disable' : '') +'"></div>'); 
			this.$container = this.$cselect.parent(); 
			this._getList({ refreshHtml: false }); 
		},
		// private method: generate list html
		_getList: function(e){
			this.count = this.cselect.length;
			if (e.refreshSelect){ $('.select-list', this.$container).remove(); }

			// loop html
			var html = this._generateHtml();

			// html for control
			var scrollHtml = (this.config.maxItems > 0 && this.config.customScroll == 1) ? '<div class="select-scroll"><span class="scroll-drag"><!-- --></span></div>' : '';
			var scrollClass = (this.config.customScroll == 1) ? 'custom-scroll' : 'default-scroll';

			// selected
			this.$selected = $('option:selected', this.$cselect);

			// check if first time or refresh
			if (e.refreshSelect){
				html = '<div class="select-list '+scrollClass+'">'+scrollHtml+'<ul>'+html+'</ul></div>';
				$(html).prependTo(this.$container);
			}else{
				html = '<span class="custom-text">'+this.$selected[0].text+'</span><div class="select-list '+scrollClass+'">'+scrollHtml+'<ul>'+html+'</ul></div>';
				$(html).prependTo(this.$container);
			}
			
			this.$list = $('ul', this.$container);
			this.$text = $('.custom-text', this.$container);
			this.$listContainer = $('.select-list', this.$container);
			this._clickHandler();

			// give class to the selected element
			$('li:eq('+(this.$selected.index())+')', this.$list).addClass('selected');

			// give width to elements
			this.$container.removeClass('done');
			this.setWidthCS(this.config.width);
			
			// standard top distance
			this.standardTop = parseInt(this.$listContainer.css('top'));

			// fire function for max length
			this._getLength({refreshSelect: e.refreshSelect });
		},
		// html for custom select
		_generateHtml: function(){
			this.$collection = this.$cselect.children();
			var html = '';
			for (var i = 0; i < this.$collection.length; i++){
				var $this = $(this.$collection[i]);
				html += '<li class="'+ ($this.attr('disabled') === 'disabled' ? 'disabled' : '') +'" data-value="'+$this[0].value+'">'+($this.data('selectik') ? $this.data('selectik') : $this[0].text)+'</li>';
			 };
			return html;
		},
		_getLength: function(e){
			if (!e.refreshSelect){ this.heightItem = $('li:nth-child(1)', this.$list).outerHeight(); }

			// check if count of options more then max
		  	if (this.count < this.config.maxItems || this.config.maxItems == 0) { this.$listContainer.hide(); this.$container.addClass('done'); this.scrollL = false; return; }
			this.scrollL = true;
           	this.heightList = this.heightItem*this.count;
			this.heightContainer = this.heightItem*this.config.maxItems;

			// put height for list
			this.$list.css('height', this.heightContainer);
			this.$listContainer.hide();
			this.$container.addClass('done');
			if (this.config.customScroll == 1) {  this._getScroll(); }
		},
		// private method: custom scroll
		_getScroll: function(){
			var allHeight = this.heightItem*this.count;
			this.heightShift = -allHeight+this.heightContainer;
			this.$bgScroll = $('.select-scroll', this.$listContainer);
			this.$bgScroll.css('height', this.heightContainer);
			this.$scroll = $('.scroll-drag', this.$listContainer);
			this.$listContainer.addClass('maxlength');

			// calculate relate of heights
			this.relating = allHeight / this.heightContainer;

			// height of scroll
			this.heightScroll = this.heightContainer*(this.heightContainer / allHeight);
			this.$scroll.css('height', this.heightScroll);

			// if selected
			if ($('.selected', this.$list).length > 0){
				this._shift($('.selected', this.$list).index());
			}
			if (this.config.customScroll){ this._scrollHandlers(); }
		},
		_scrollHandlers: function(){
            var shiftL;
			var selectik = this;
			// bind mousewheel
			this.$list.bind('mousewheel', function(event, deltaY) {
				shiftL = parseInt(selectik.$list.css('top'))+(deltaY*selectik.heightItem);
				selectik._shiftHelper(shiftL);
				return false;
			});

			// bind click on scroll background
			this.$bgScroll.click(function(e){
				var direction = (((e.pageY - $(this).offset().top)/selectik.heightContainer) > 0.5) ? -1 : 1;
				shiftL = parseInt(selectik.$list.css('top')) + (selectik.heightItem * direction);
				selectik._shiftHelper(shiftL);
				return false;
			});
			
			// bind scroll on mousedown selecting
	        this.$text.on('mousedown', function(e){ selectik._draggable(e, true); });

			// draggable handler and calculate
	        this.$scroll.on('mousedown', function(e){ mouseTrigger = false; selectik._draggable(e, true); });
			$(document).on('mouseup', function(e){ selectik._draggable(e, false); });
		},
		// private method: draggable for scroll
		_draggable: function(e, on){
			var selectik = this;
			if (on){
				openList = false;
				if (e.preventDefault()) { e.preventDefault(); }
				var startPosition = parseInt(selectik.$scroll.css('top'));
				var helper = e.clientY;

				var textHeight = selectik.$text.outerHeight();
				$(document).bind('mousemove', function(e){
					if (mouseTrigger){
						var listTopPosition = selectik.$list.parent().offset().top;
						var listHeight = selectik.$list.outerHeight();
						var direction = (selectik.topPosition > 0) ? -1 : 1;
						var difference = (selectik.topPosition > 0) ? textHeight : 0;		
						var cursorPosition = (e.clientY - (listTopPosition - difference - $(window).scrollTop()));
						
						if (cursorPosition < 0 || cursorPosition > (listHeight + textHeight)){
							var deltaY = (cursorPosition < 0) ? 1 : -1;
							var shiftL = parseInt(selectik.$list.css('top'))+(deltaY*selectik.heightItem);
							selectik._shiftHelper(shiftL);
						}
					}else{
						var newPosition = (helper - e.clientY) - startPosition;
						selectik._shiftHelper(newPosition*selectik.relating);
					}
				});
			}else{
				$(document).unbind('mousemove');
					openList = true;
				}
		},
		// private method: shift
		_shiftHelper: function (e){
			e = (e > 0) ? 0 : e;
			e = (e < this.heightShift) ? this.heightShift: e;
			this.$list.css('top', e);
			this.$scroll.css('top', -e/this.relating);
		},
		// private method: shift conrtol
		_shift: function(indexEl){
			if (indexEl < 0 || indexEl == this.count) { return; }
			this.topShift = (indexEl > this.count-this.config.maxItems) ? this.heightList-this.heightContainer : this.heightItem*indexEl;
			$('.selected', this.$list).removeClass('selected');
			var $selectedLi = $('li:nth-child('+(indexEl+1)+')', this.$list);
			$selectedLi.addClass('selected');
			if (openList && selectControl){
				this.$text.text($selectedLi.data('value'));
			}
			if (!this.scrollL) { return; }
			this._shiftHelper(-this.topShift);
		},		
		// private method: click on li
		_clickHandler: function(){
			var selectik = this;
			this.$listContainer.off('mousedown', 'li').on('mousedown', 'li', function(e){
				if ($(this).hasClass('disabled')) { e.preventDefault(); return;	};
				selectik._changeSelected($(this));
			});	
		},
		// private method: handlers
		_handlers: function(){
            // reset button
			var selectik = this;
            var $reset = $('input[type="reset"]', this.$cselect.parents('form'));
            if ($reset.length > 0){
                $reset.bind('click',function(){
                    var index = (selectik.$selected.length > 0) ? selectik.$selected.index(): 0;
                    selectik._changeSelected($('option:eq('+index+')', selectik.$cselect));
                });
            }

			// change on original select
			this.$cselect.bind('change', function(){
				 if (selectik.change) { selectik.change = false; return true; }
				 selectik._changeSelected($('option:selected', $(this)));
			});

			// click on select
			this.$text.bind('click', function(e){
	        	if( selectik.$container.hasClass('disable') || mouseTrigger) { return false; }
				selectik.$cselect.focus();
				selectik._fadeList(false, true);
			});
			
			// mouse down/up
			var mouseDown = false;
			this.$text.bind('mousedown', function(e){
				e.preventDefault()
				mouseDown = true;
				setTimeout(function(){
					if (mouseDown){
						mouseTrigger = true;
						selectik._fadeList(false, true);
					}
				}, 300);
			});
			this.$text.bind('mouseup', function(){
				mouseDown = false;
			});
			this.$listContainer.on('mouseup', 'li',function(e){
				if ($(this).hasClass('disabled')) { return;	};
				selectik._changeSelected($('option:eq('+$(e.currentTarget).index()+')', selectik.$cselect));
				selectik.hideCS(true);
				mouseTrigger = false;
				selectik.$cselect.focus();
			});

            // active class
            this.$cselect.bind('focus', function(){
                selectik.$container.addClass('active');
            });
            this.$cselect.bind('blur', function(){
				if (mouseTrigger) return;
				selectik.hideCS(true);
                selectik.$container.removeClass('active');
            });

			this.$cselect.bind('keyup', function(e) { selectik._keysHandlers(e); });
			if (isOpera){
				selectik.$cselect.bind('keydown', function() { trigger = true; });
			};
		},
        // private method: handlers on keys
        _keysHandlers: function(e){
            if (e.keyCode == 13 && this.$listContainer.is(':visible')) { this._fadeList(true, false); }
            if (!isIE){
                if (e.keyCode == 27 && this.$listContainer.is(':visible')) { this._fadeList(true, true); }
            }
            this.$cselect.change();
            if (this.scrollL) { this._shift($('option:selected', this.$cselect).index()); }
        },
		// private method: change selected
		_changeSelected: function(e){
			var dataValue = (e.parents('select').length > 0) ? e.attr('value') : e.data('value');
            var textValue = e.text();
			this._changeSelectedHtml(dataValue, textValue, e.index()+1);
		},
		// private method: change selected
		_changeSelectedHtml: function(dataValue, textValue, index){
			if (index > this.count || index == 0) { return false;}
			this.change = true;
			var $selected = $('.selected', this.$list);
			$('option:eq('+$selected.index()+')', this.$cselect).prop('selected', false); //
			$('option:eq('+(index-1)+')', this.$cselect).prop('selected', true);

			this.$cselect.prop('value', dataValue).change();
			$selected.removeClass('selected');
			$('li:nth-child('+ index +')', this.$list).addClass('selected');
			this.$text.text(textValue);
		},
		// private method: show/hdie list
		_fadeList: function(out, text){
			var $openList = $('.'+this.config.containerClass+'.open_list');
			if ($openList.length == 1){
				$openList.children('select').data('selectik').hideCS();	
				return;
			}		
            if (!text){
                $openList.children('.select-list').stop(true, true).fadeOut(this.config.speedAnimation).parent().toggleClass('open_list');
                if (out){ return; }
            }
			openList = false;
			this.positionCS();
			this.$listContainer.stop(true, true).fadeToggle(this.config.speedAnimation);
			this.$listContainer.parent().toggleClass('open_list');
			var selectik = this;
			setTimeout(function(){ openList = true; }, selectik.config.speedAnimation);
		},
		// public method: hide list
		hideCS: function(next){
			this.$listContainer.fadeOut(this.config.speedAnimation);
			this.$container.removeClass('open_list');
            if (!next) this.$cselect.focus();
			openList = true;		
		},
		// public method: show list
		showCS: function(){
			openList = false;
			this.$listContainer.fadeIn(this.config.speedAnimation);
			this.$container.addClass('open_list');
		},
		// public method: postion of list
		positionCS: function(){
			if (!this.config.smartPosition) return;
			elParent = this.$listContainer.parent();
			var heightPosition = (this.scrollL) ? this.config.maxItems*this.heightItem : this.count*this.heightItem;
			var quaItems = (this.scrollL) ? this.config.maxItems : this.count;
			var $window = $(window);
			var widnowScrollTop = $window.scrollTop();
			var topPosition = ($window.height() - (elParent.offset().top - widnowScrollTop) - elParent.outerHeight() < heightPosition) ? -quaItems*this.heightItem-(elParent.outerHeight()/4) : this.standardTop;
			this.topPosition = ((elParent.offset().top - widnowScrollTop) < heightPosition && ($('html').height() - elParent.offset().top) > heightPosition) ? this.standardTop : topPosition;
			this.$listContainer.css('top', this.topPosition);
		},
		// public method: refresh list
		refreshCS: function() {
            this._getList({ refreshSelect: true });
	    },
		// public method: change active element
		changeCS: function(val) {
			var index = (val.index > 0) ? val.index : $('option[value="'+val.value+'"]', this.$cselect).index() + 1;
			var $option = $('option:nth-child('+(index)+')', this.$cselect);
			var dataValue = $option.attr('value');
			var textValue = $option.text()
			this._changeSelectedHtml(dataValue, textValue, index);
		},
		// public method: disable list
		disableCS: function(){
			this.$cselect.attr('disabled', true);
			this.$container.addClass('disable');
		},
		// public method: enable list
		enableCS: function(){
			this.$cselect.attr('disabled', false);
			this.$container.removeClass('disable');
		},
        // public method: required
        requiredCS: function(){
            this.$text.toggleClass('required');
        },
		// public method: width of select
		setWidthCS: function(width){
			//Paddings may has element or/and it's parent
			$.each([this.$list,this.$text],function() {
				var $parent = $(this).parent(),
				parentPaddings  = $parent.outerWidth() - $parent.width(),
				elementPaddings = $(this).outerWidth() - $(this).width(),
				paddings = parentPaddings + elementPaddings;
				$(this).css('width', width - paddings);
			});
		}		
	};

	$.fn.selectik = function(options, methods) {
		if (isMobile || isOperaMini) return;
        return this.each(function() {
            if ($('optgroup', this).length > 0 || $(this).attr('multiple') == 'multiple') { return; }
            if (undefined == $(this).data('Selectik')) {
                // create a new instance of the plugin
				var selectik = new Selectik(options);
				
				// apply new methods
				for (i in methods){
					selectik[i] = methods[i];
				}
				
				// fire selectik
				selectik._init(this);
                $(this).data('selectik', selectik);
            }
        });
    };
	
	// global handlers
	$(window).resize(function(){
        if (openList){
			var $list = $('.open_list');
            if (!$list.length > 0) { return; }
			
            $list.children('select').data('selectik').positionCS($('.select-list:visible'));
        }
	});
	$(document).bind('click', function(e){
		if ($(e.target).hasClass('disabled')) { return; }
		if (trigger) { trigger = false; return; }
		if (openList){
			openList = false;
			var $list = $('.open_list');
			if ($list.length > 0){
				var $select = $list.children('select');
				$select.data('selectik').hideCS();
			}
		}
	});
})(jQuery);