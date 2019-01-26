/*
    This file is part of JonDesign's SmoothGallery v2.1beta1.

    JonDesign's SmoothGallery is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 3 of the License, or
    (at your option) any later version.

    JonDesign's SmoothGallery is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with JonDesign's SmoothGallery; if not, write to the Free Software
    Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA

    Main Developer: Jonathan Schemoul (JonDesign: http://www.jondesign.net/)
    Contributed code by:
    - Christian Ehret (bugfix)
	- Nitrix (bugfix)
	- Valerio from Mad4Milk for his great help with the carousel scrolling and many other things.
	- Archie Cowan for helping me find a bugfix on carousel inner width problem.
	- Tomocchino from #mootools for the preloader class
	Many thanks to:
	- The mootools team for the great mootools lib, and it's help and support throughout the project.
	- Harald Kirschner (digitarald: http://digitarald.de/) for all his great libs. Some used here as plugins.
*/



/* some quirks to circumvent broken stuff in mt1.2 */
function isBody(element){
	return (/^(?:body|html)$/i).test(element.tagName);
};
Element.implement({
	getPosition: function(relative){
		if (isBody(this)) return {x: 0, y: 0};
		var el = this, position = {x: 0, y: 0};
		while (el){
			position.x += el.offsetLeft;
			position.y += el.offsetTop;
			el = el.offsetParent;
		}
		var rpos = (relative) ? $(relative).getPosition() : {x: 0, y: 0};
		return {x: position.x - rpos.x, y: position.y - rpos.y};
	}
});

// declaring the class
var gallery = {
	Implements: [Events, Options],
	options: {
		showArrows: true,
		resolution: 1,
		showCarousel: false,
		showInfopane: false,
		embedLinks: true,
		fadeDuration: 1/*500*/,
		timed: false,
		delay: 9000,
		preloader: true,
		preloaderImage: true,
		preloaderErrorImage: true,
		/* Data retrieval */
		manualData: [],
		populateFrom: false,
		populateData: true,
		destroyAfterPopulate: true,
		elementSelector: "div.imageElement",
		titleSelector: "h3",
		subtitleSelector: "p",
		linkSelector: "a.open",
		imageSelector: "img.full",
		thumbnailSelector: "img.thumbnail",
		defaultTransition: "fade",
		/* InfoPane options */
		slideInfoZoneOpacity: 0.7,
		slideInfoZoneSlide: true,
		/* Carousel options */
		carouselMinimizedOpacity: 0.4,
		carouselMinimizedHeight: 20,
		carouselMaximizedOpacity: 0.9,
		thumbHeight: 75,
		thumbWidth: 100,
		thumbSpacing: 10,
		thumbIdleOpacity: 0.2,
		textShowCarousel: 'Pictures',
		showCarouselLabel: true,
		thumbCloseCarousel: true,
		useThumbGenerator: false,
		thumbGenerator: 'resizer.php',
		useExternalCarousel: false,
		useExternalCarouselHtml: false,
		carouselElement: false,
		carouselHorizontal: true,
		activateCarouselScroller: true,
		carouselPreloader: true,
		textPreloadingCarousel: 'Carregando...',
		/* CSS Classes */
		baseClass: 'jdGallery',
		withArrowsClass: 'withArrows',
		/* Plugins: HistoryManager */
		useHistoryManager: false,
		customHistoryKey: false,
		/* Plugins: ReMooz */
		useReMooz: false,
		useExternalArrow:false,
		startIndex:0,
		isFullPreview:false,
		isPurePreview:false,
		isDisplayHDTips:true,
		currentAssetID:0
	},
	initialize: function(element, options) {
		this.setOptions(options);
		this.loading = false;
		this.loadingTurntable = false;
		this.playLoadingTurntable = false;
		this.arrTurntable = [];
		this.arrLoadedIndex = [];
		this.currentIndex = 0;
		this.indexBeforeChangeResolution = 0;
		this.playingItemIndex = 0;
		this.currentAutoLoadIndex = 0;
		this.currentTurntThumbs = [];
		this.currentDragStartX = 0;
		this.originalDragX = 0;
		this.originalDragY = 0;
		this.currentDragStartX = this.originalDragX;
		this.playing = false;
		this.resolution = this.options.resolution;
		this.startIndex = this.options.startIndex;
		this.isFullPreview = this.options.isFullPreview;
		this.isPurePreview = this.options.isPurePreview;
		this.isDisplayHDTips = this.options.isDisplayHDTips;
		this.currentAssetID = this.options.currentAssetID;
		this.fireEvent('onInit');
		this.currentIter = 1;
		this.reInit = false;
		this.lastIter = 0;
		this.maxIter = 0;
		this.galleryElement = element;
		this.galleryData = this.options.manualData;
		this.galleryInit = 1;
		this.galleryElements = Array();
		this.thumbnailElements = Array();
		this.galleryElement.addClass(this.options.baseClass);
		this.imageContainer = document.getElementById('HDContainer');
		this.imgDragInfo = {x:0,y:0,scrollX:0,scrollY:0};
		this.spaceKeyDown = false;
		this.inTurntable = false;
		
		this.populateFrom = element;
		if (this.options.populateFrom)
			this.populateFrom = this.options.populateFrom;		
		if (this.options.populateData)
			this.populateData();
		element.style.display="block";
		
				
		this.constructElements();
		if(this.isFullPreview==false){
			this.setGallerySize(this.resolution);
			this.resetResolutionLink(this.resolution);
		}

		/*if ((this.galleryData.length>1)&&(this.options.showArrows))
		{
			if(this.options.useExternalArrow==true){
				
			}
			else{
				var leftArrow = new Element('a',{'class':'left','id':'leftArrow'}).addEvent(
					'click',
					this.prevItem.bind(this)
				).injectInside(element);
				var rightArrow = new Element('a',{'class':'right','id':'rightArrow'}).addEvent(
					'click',
					this.nextItem.bind(this)
				).injectInside(element);
				this.galleryElement.addClass(this.options.withArrowsClass);
			}
		}*/
		
		
		this.loadingElement = new Element('div',{'class':'loadingContainer','id':'loadingContainer'}).injectInside(element);
		var loading = new Element('div',{'class':'loadingElement','id':'loadingElement'}).injectInside(this.loadingElement);
		
		//new Element('div',{'class':'loadingImg'}).injectInside(loading);
		if (this.options.showCarousel) this.initCarousel();
		
		
		this.doSlideShow(1);
		this.sliderEl = $('myElement');
		this.knob = this.sliderEl.getElement('.knob');
		
		
		this.clearSlider();
		this.SliderStep = 1;
		this.turntableTimer = null;
		this.TurntableLoadingTimer = null
		
		
		this.setEvents();
		
		//this.addMouseOverEvents(this.resolution);
		if(this.galleryData.length<this.startIndex || this.startIndex<0){
			this.startIndex = 0;
		}
		if(this.startIndex==1){
			this.currentIter = 0;
		}
		if(this.isFullPreview==false){
			this.setImageDrag();
		}
		this.goTo(this.startIndex);
		this.scrollThumbnails(this.startIndex,true);
	},
	setEvents: function(){
		
		$('playContainer').addEventsMoo({
			/*'mouseover': function () {
				this.addClass('playMouseOver');
			},
			'mouseout': function () {				
				this.removeClass('playMouseOver');
			},*/
			'click': function (event) {
				if(this.playing==true){
					this.turntablePause();
				}
				else{
					this.turntablePlay();
				}
				event.stopPropagation();
			}.bind(this)
		});
		/*$('action_Turntable').addEventsMoo({
			'mouseover': function () {
				this.addClass('playMouseOver');
			},
			'mouseout': function () {				
				this.removeClass('playMouseOver');
			}
		});*/
		if(isIE()){
			document.addEventsMoo({
				'keydown':
					function (event) { 
						this.keyDownEvent(event);
					}.bind(this),
				'keyup':
					function(event){
						this.keyUpEvent(event);		
					}.bind(this)
			});
		}
		else{
			window.addEventsMoo({
				'keydown':
					function (event) { 
						this.keyDownEvent(event);
					}.bind(this),
				'keyup':
					function(event){
						this.keyUpEvent(event);		
					}.bind(this)
			});
		}
		if(this.isFullPreview==false){
			$$('#standardLink','#standardResolution').addEvent('click',
				function(event){
					if($('standardLink').hasClass('link')){
						this.changeResolution(1);
						this.setGallerySize(1);
						this.goTo(this.indexBeforeChangeResolution);
					}
				}.bind(this)
			);
			$$('#HDLink','#HDResolution').addEvent('click',
				function(event){
					if($('HDLink').hasClass('link')){
						this.changeResolution(2);
						this.setGallerySize(2);
						this.goTo(this.indexBeforeChangeResolution);
					}
				}.bind(this)
			);
			$$('#originalLink','#originalResolution').addEvent('click',
				function(event){
					if($('originalLink').hasClass('link')){
						this.changeResolution(3);
						this.setGallerySize(3);
						this.goTo(this.indexBeforeChangeResolution);
					}
				}.bind(this)
			);
		}
				
		if(isIE()){
			$('myGallery').addEventsMoo({	
				'mouseover': function () {
					$('leftArrow').style.display = 'block';
					$('rightArrow').style.display = 'block';
				},
				'mouseout': function () {				
					$('leftArrow').style.display = 'none';
					$('rightArrow').style.display = 'none';
				},
				'click':function(event){
					if(this.playing==true){
						this.turntablePause();
					}
				}.bind(this)
			});	
		}
		else{
			$('myGallery').addEventsMoo({
				'mouseover': function () {
					$('leftArrow').fade('in');
					$('rightArrow').fade('in');
				},
				'mouseout': function () {				
					$('leftArrow').fade('out');
					$('rightArrow').fade('out');
				},
				'click':function(event){
					if(this.playing==true){
						this.turntablePause();
					}
				}.bind(this)
			});		
		}
		
		/*$('imageDrag').addEventsMoo({
			'mouseover': function () {
				if(this.spaceKeyDown==true){
					$('imageDrag').addClass('imageDragMouseOver');
				}
			}.bind(this),
			'mouseout': function () {
				$('imageDrag').removeClass('imageDragMouseOver');
			}
		});
		$('action_Turntable').addEventsMoo({
			'mouseover': function () {
				$('leftArrow').fade('in');
				$('rightArrow').fade('in');
			},
			'mouseout': function () {				
				$('leftArrow').fade('out');
				$('rightArrow').fade('out');
			}
		})*/
		if(isIE()){
			$('leftArrow').addEventsMoo({
				'mouseover': function () {
					$('leftArrow').style.display = 'block';
					$('rightArrow').style.display = 'block';
				},
				'mouseout': function () {				
					$('leftArrow').style.display = 'none';
					$('rightArrow').style.display = 'none';
				},
				'click':function(){
					this.prevItem();
				}.bind(this)
			});
			$('rightArrow').addEventsMoo({
				'mouseover': function () {
					$('leftArrow').style.display = 'block';
					$('rightArrow').style.display = 'block';
				},
				'mouseout': function () {				
					$('leftArrow').style.display = 'none';
					$('rightArrow').style.display = 'none';
				},
				'click':function(){
					this.nextItem();
				}.bind(this)
			});
		}
		else{
			$('leftArrow').addEventsMoo({
				'mouseover': function () {
					$('leftArrow').fade('in');
					$('rightArrow').fade('in');
				},
				'mouseout': function () {				
					$('leftArrow').fade('out');
					$('rightArrow').fade('out');
				},
				'click':function(){
					this.prevItem();
				}.bind(this)
			});
			$('rightArrow').addEventsMoo({
				'mouseover': function () {
					$('leftArrow').fade('in');
					$('rightArrow').fade('in');
				},
				'mouseout': function () {				
					$('leftArrow').fade('out');
					$('rightArrow').fade('out');
				},
				'click':function(){
					this.nextItem();
				}.bind(this)
			});
		}
		if(this.isFullPreview==false){
			window.addEventsMoo({
				//'scroll': adjustPosition,
				'domready': adjustPosition,
				'resize': function(){
						executeResizeFunctions();
						this.setGallerySize(this.resolution);
					}.bind(this)
			});
			$$('#btnCloseWindow').addEvent('click',
				function(){
					window.opener = null;
					window.open('', '_self');
					window.close();
				}.bind(this)
			);
			this.addMouseOverEvents(3);
		}
		else{
			if(this.isPurePreview==false){
				$$('#signatureHD','#signatureHD360').addEvent('click',
					function(event){
						var r = document.getElementById('resolutionValue').value;
						if(!isIE()){
							window.open(HOMEURL + 'HDView/index.cfm/ID/' + assetID + '/r/' + r +'/i/' + (this.currentIter+1));
						}
						else{
							window.open( HOMEURL + 'HDView/index.cfm/ID/' + assetID + '/r/' + r +'/i/' + (this.currentIter+1),
								  "", 
								  "resizable=yes,left=0,top=0,width="+(screen.availWidth - 10) +",height=" + (screen.availHeight - 30)
								  );
						}
					}.bind(this)
				);
			}
		}
	},
	keyUpEvent: function(event){
		if(this.isFullPreview==false){
			var kc = event.event.keyCode;
			if(kc==32){
				this.spaceKeyDown = false;
				var imgDrag = $('imageDrag')
				if(isIE()||isSafari()){
					imgDrag.style.cursor = 'auto';
					//imgDrag.style.zoom = '1';
					//imgDrag.removeClass('imageDragMouseOver');
				}
				else{
					imgDrag.removeClass('imageDragMouseOver');
				}
				if(this.inTurntable==true){
					imgDrag.addClass('hidden');
				}
			}
		}
	},
	keyDownEvent: function(event){
		var target = event.target ? event.target : event.srcElement;
		if(target.localName && target.localName=='input'){	// text input
			return;
		}
		var kc = event.event.keyCode;
		var blockDefault = false;
		if(kc==37){
			if(this.playing==true){
				this.turntablePause();
			}
			this.playTurntablePre();
			blockDefault = true;
		}
		else if(kc==39){
			if(this.playing==true){
				this.turntablePause();
			}
			this.playTurntableNext();
			blockDefault = true;
		}
		else if(kc==32){
			if(this.isFullPreview==false){
				this.spaceKeyDown = true;
				var imgDrag = $('imageDrag')
				if(isIE()||isSafari()){
					imgDrag.style.cursor = 'pointer';
					//imgDrag.style.zoom = '1';
					//imgDrag.addClass('imageDragMouseOver');
				}
				else{
					imgDrag.addClass('imageDragMouseOver');
				}
				blockDefault = true;
				if(this.inTurntable==true){
					imgDrag.removeClass('hidden');
				}
			}
		}
		if(blockDefault==true){
			event.preventDefault();
		}
	},
	setImageDrag: function(){
		var imgDrag = new Drag('imageDrag', {
			snap: 5,
			onSnap: function(el){
				
			},
			onComplete: function(el){
				this.clearImgDragInfo(false);
				el.style.left = '0px';
				el.style.top = '0px';
			}.bind(this),
			onDrag: function(el){
				if(this.spaceKeyDown==false){
					return;					
				}
				var size = this.imageContainer.getScrollSize();
				if(size.x>0 || size.y>0){
					this.imgDragInfo.scrollX = this.imageContainer.getScrollLeft();
					this.imgDragInfo.scrollY = this.imageContainer.getScrollTop();
					var dictX = el.offsetLeft - this.imgDragInfo.x;
					var dictY = el.offsetTop - this.imgDragInfo.y;
					this.imgDragInfo.scrollX = this.imgDragInfo.scrollX - dictX;
					this.imgDragInfo.scrollY = this.imgDragInfo.scrollY - dictY;
					if(this.imgDragInfo.scrollX<0){
						this.imgDragInfo.scrollX = 0;
					}
					if(this.imgDragInfo.scrollY<0){
						this.imgDragInfo.scrollY = 0;
					}
					this.imageContainer.scrollTo(this.imgDragInfo.scrollX,this.imgDragInfo.scrollY);
					this.imgDragInfo.x = el.offsetLeft;
					this.imgDragInfo.y = el.offsetTop;
				}
			}.bind(this)
		});
	},
	clearImgDragInfo: function(blAll){
		this.imgDragInfo.x = 0;
		this.imgDragInfo.y = 0;
		if(blAll){
			this.imgDragInfo.scrollX = 0;
			this.imgDragInfo.scrollY = 0;
		}
	},
	reInitialize: function(arrData,resolution) {
		this.resolution = resolution;
		this.loading = false;
		//this.arrTurntable = [];
		//this.arrLoadedIndex = [];
		this.loadingTurntable = false;
		this.playLoadingTurntable = false;
		this.indexBeforeChangeResolution = this.currentIndex;
		this.currentIndex = 0;
		this.playingItemIndex = 0;
		this.currentAutoLoadIndex = 0;
		this.currentTurntThumbs = [];
		this.playing = false;
		this.fireEvent('onInit');
		//this.currentIter = 1;
		this.lastIter = 0;
		this.maxIter = 0;
		this.galleryInit = 1;
		this.galleryElements = Array();
		this.thumbnailElements = Array();
		this.reInit = true;
		
		this.destoryOldElements();///////////////////////////////////
		this.populateDataFromArray(arrData,resolution);		
				
		this.constructElements()
		this.initCarousel();

		//this.doSlideShow(1);
		this.clearSlider();
		this.SliderStep = 1;
		this.turntableTimer = null;
		this.TurntableLoadingTimer = null;
	},
	changeResolution: function(resolution){
		pageIndicator = resolution;
		var rWidth = null;
		if(resolution==3){
			rWidth = this.galleryElements[0].originalWidth;
		}
		adjustPosition(rWidth);
		if(this.playing==true){
			this.stopTurntable();
		}
		this.reInitialize(myData,resolution);
		this.resetResolutionLink(resolution);
		//this.resetTurntableImgSize(resolution);
		//this.addMouseOverEvents(resolution);
	},
	resetTurntableImgSize: function(r){
		
	},
	addMouseOverEvents: function(r){
		if(r==3){
			if(isIE()){				
				$('HDContainer').addEventsMoo({
					'mouseover': function () {
						$('leftArrow').style.display = 'block';
						$('rightArrow').style.display = 'block';
					},
					'mouseout': function () {				
						$('leftArrow').style.display = 'none';
						$('rightArrow').style.display = 'none';
					}
				});
			}
			else{
				$('HDContainer').addEventsMoo({
					'mouseover': function () {
						$('leftArrow').fade('in');
						$('rightArrow').fade('in');
					},
					'mouseout': function () {				
						$('leftArrow').fade('out');
						$('rightArrow').fade('out');
					}
				});
			}
		}
		else{
			$('HDContainer').removeEvents();
		}
	},
	populateData: function() {
		currentArrayPlace = this.galleryData.length;
		options = this.options;
		var data = $A(this.galleryData);
		data.extend(this.populateGallery(this.populateFrom, currentArrayPlace));
		this.galleryData = data;
		this.fireEvent('onPopulated');
	},
	populateGallery: function(element, startNumber) {
		var data = [];
		options = this.options;
		currentArrayPlace = startNumber;
		if(this.isFullPreview==false){
			this.destoryOldElements();
		}
		data = this.populateDataFromArray(myData,this.resolution);
		return data;
	},
	destoryOldElements: function(){
		this.populateFrom.getElements('div.slideElement').each(function(el) {
			el.dispose();
		});
	},
	populateDataFromArray: function(arrData,resolution){
		var data = [];
		var len = arrData.length;
		var key = 'STANDARD';
		var turntableR = 1;
		if(resolution==2){
			key = 'HD';
			//keyT = 'HDTRUNT';
		}
		else if(resolution==3){
			key = 'ORIGINAL';
			//keyT = 'ORIGINALTRUNT';
		}
		var imgPath = '';
		var grayThumb = false;
		var standardWidth,standardHeight,HDWidth,HDHeight,originalWidth,originalHeight;
		var trueHD,trueOriginal;
		for(var i=0;i<len;i++){
			imgPath = arrData[i][key];			
			standardWidth = arrData[i]['STANDARDWIDTH'];
			standardHeight = arrData[i]['STANDARDHEIGHT'];
			HDWidth = arrData[i]['HDWIDTH'];
			HDHeight = arrData[i]['HDHEIGHT'];
			originalWidth = arrData[i]['ORIGINALWIDTH'];
			originalHeight = arrData[i]['ORIGINALHEIGHT'];
			trueHD = true;
			trueOriginal = true;
			if(arrData[i]['HD']==''){
				HDWidth = arrData[i]['STANDARDWIDTH'];
				HDHeight = arrData[i]['STANDARDHEIGHT'];
				trueHD = false;
				//originalWidth = arrData[i]['STANDARDWIDTH'];
				//originalHeight = arrData[i]['STANDARDHEIGHT'];
			}
			if(arrData[i]['ORIGINAL']==''){
				originalWidth = arrData[i]['STANDARDWIDTH'];
				originalHeight = arrData[i]['STANDARDHEIGHT'];
				trueOriginal = false;
			}
			grayThumb = false;
			if(imgPath==''){
				imgPath = arrData[i]['STANDARD'];
				/*if(key=='HD'){
					imgPath = arrData[i]['STANDARD'];					
				}
				else if(key=='ORIGINAL'){
					imgPath = arrData[i]['HD'];
					if(imgPath==''){
						imgPath = arrData[i]['STANDARD'];
					}
				}*/
				grayThumb = true;
			}
			var turntableLength = arrData[i]['STANDARDTRUNT'];
			if(turntableLength>0){
				if(resolution==2 && arrData[i]['HDTRUNT']>0){
					turntableR = 2;
				}
				else if(resolution==3){
					if(arrData[i]['ORIGINALTRUNT']>0){
						turntableR = 3;
					}
					else if(arrData[i]['HDTRUNT']>0){
						turntableR = 2;
					}
				}
			}
			elementDict = $H({
				lenTurntable:turntableLength,
				turntableResolution: turntableR,
				image: imgPath,
				number: i,
				key: arrData[i]['KEY'],
				transition: this.options.defaultTransition,
				thumbnail: arrData[i].THUMB,
				grayThumb: grayThumb,				
				standardWidth: standardWidth,
				standardHeight: standardHeight,	
				HDWidth: HDWidth,
				HDHeight: HDHeight,
				originalWidth: originalWidth,
				originalHeight: originalHeight,
				originalFileSize:arrData[i].ORIGINALFILESIZE,
				trueOriginal: trueOriginal,
				trueHD: trueHD
			});
			
			data.extend([elementDict]);
		};
		this.galleryData = data;
		return data;
	},

	constructElements: function() {
		el = this.galleryElement;

		this.maxIter = this.galleryData.length;
		var currentImg;
		var largeThumbnails = $('myGallery').getElements('.slideElement');
		for(i=0;i<this.galleryData.length;i++)
		{
			if(this.isFullPreview==false){
				var currentImg = new Fx.Morph(
					new Element('div').addClass('slideElement').setStyles({
						'position':'absolute',
						'left':'0px',
						'right':'0px',
						'margin':'0px',
						'padding':'0px',
						'backgroundPosition':"center center",
						'opacity':'0'
					}).injectInside(el),
					{duration: this.options.fadeDuration}
				);
			}
			else{
				var currentImg = new Fx.Morph(largeThumbnails[i]);
			}
			if (this.options.preloader)
			{
				currentImg.source = this.galleryData[i].image;
				currentImg.loaded = false;
				currentImg.standardWidth = this.galleryData[i].standardWidth;
				currentImg.standardHeight = this.galleryData[i].standardHeight;
				currentImg.HDWidth = this.galleryData[i].HDWidth;
				currentImg.HDHeight = this.galleryData[i].HDHeight;
				currentImg.originalWidth = this.galleryData[i].originalWidth;
				currentImg.originalHeight = this.galleryData[i].originalHeight;
				currentImg.originalFileSize = this.galleryData[i].originalFileSize;
				currentImg.trueHD = this.galleryData[i].trueHD;
				currentImg.trueOriginal = this.galleryData[i].trueOriginal;
				currentImg.load = function(imageStyle, i) {
					if (!imageStyle.loaded)	{						
						this.galleryData[i].imgloader = new Asset.image(imageStyle.source, {
		                            'onload'  : function(img, i){
		                            				if(this.isFullPreview==false){
														img.element.setStyle('backgroundImage',"url('" + img.source + "')")
		                            				}
													img.loaded = true;
													img.width = this.galleryData[i].imgloader.width;
													img.height = this.galleryData[i].imgloader.height;
													if(this.galleryData[i].lenTurntable==0){
														this.hideLoading(i);
													}
												}.pass([imageStyle, i], this),
									 'onerror'  : function(img, i){
		                            				if(this.isFullPreview==false){
														img.element.setStyle('backgroundImage',"url('" + img.source + "')")
		                            				}
													img.loaded = true;
													img.width = this.galleryData[i].imgloader.width;
													img.height = this.galleryData[i].imgloader.height;
													if(this.galleryData[i].lenTurntable==0){
														this.hideLoading(i);
													}
												}.pass([imageStyle, i], this)
						});						
					}
				}.pass([currentImg, i], this);
			} else {
				currentImg.element.setStyle('backgroundImage',
									"url('" + this.galleryData[i].image + "')");
			}
			this.galleryElements[parseInt(i)] = currentImg;
		}
	},
	destroySlideShow: function(element) {
		var myClassName = element.className;
		var newElement = new Element('div').addClass('myClassName');
		element.parentNode.replaceChild(newElement, element);
	},
	hideLoading: function(index){
		if(this.loading==true && (index==-1 || this.currentIter==index)){
			$('loadingContainer').setStyle('display','none');
			this.loading = false;
		}
	},
	showLoading: function(blTurntable){
		if(blTurntable==true){
			$('loadingContainer').addClass('loadingImagesContainer');
		}
		else{
			$('loadingContainer').removeClass('loadingImagesContainer');
		}
		if(this.loading==false){
			this.loading = true;
			$('loadingContainer').setStyle('display','block');
		}
	},
	startSlideShow: function() {
		this.fireEvent('onStart');
		this.loadingElement.style.display = "none";
		this.lastIter = this.maxIter - 1;
		this.currentIter = 0;
		this.galleryInit = 0;
		this.galleryElements[parseInt(this.currentIter)].set({opacity: 1});
		if (this.options.showInfopane)
			this.showInfoSlideShow.delay(1000, this);
		if (this.options.useReMooz)
			this.makeReMooz.delay(1000, this);
		/*var textShowCarousel = formatString(this.options.textShowCarousel, this.currentIter+1, this.maxIter);
		if (this.options.showCarousel&&(!this.options.carouselPreloader)&&(!this.options.useExternalCarousel))
			this.carouselBtn.set('html', textShowCarousel).setProperty('title', textShowCarousel);*/
		this.prepareTimer();
		if (this.options.embedLinks)
			this.makeLink(this.currentIter);
	},
	scrollThumbnails: function(num,blNext){	// next or prev
		var carcousel = $('carouselWrapper');
		if(carcousel.scrollWidth>carcousel.clientWidth){
			if(blNext==true){
				if(num==0){
					carcousel.scrollTo(0,0);
				}
				else{
					var additionalWidth = 0;
					if(this.isFullPreview==true){
						//num = num/2|0;
						additionalWidth = 6;
					}
					var width = 67 * (num + 1) + 12 + additionalWidth;
					if(width>carcousel.clientWidth+carcousel.getScrollLeft()){
						carcousel.scrollTo(width - carcousel.clientWidth,0);
						//carcousel.scrollTo(carcousel.getScrollLeft()+67,0);
					}
				}
			}
			else{
				if(num==this.maxIter - 1){
					carcousel.scrollTo(67 * (num + 1) + 12,0);
				}
				else{
					var additionalWidth = 0;
					if(this.isFullPreview==true){
						//num = num/2|0;
						additionalWidth = 2;
					}
					/*var width = 67 * (this.maxIter - num) + 12;
					if(width>carcousel.clientWidth){
						carcousel.scrollTo(carcousel.getScrollLeft()-67,0);
					}*/
					var width = 67 * (num) + 12;
					if(width<carcousel.getScrollLeft()){
						carcousel.scrollTo(carcousel.getScrollLeft()-67 - additionalWidth,0);
					}
				}
			}
		}
	},
	nextItem: function() {

		this.fireEvent('onNextCalled');
		//console.log('current2:'+this.currentIter);
		//console.log(this.toString());
		this.nextIter = this.currentIndex + 1;//this.currentIter+1;
		if (this.nextIter >= this.maxIter)
			this.nextIter = 0;
		this.galleryInit = 0;
		this.goTo(this.nextIter);
		this.scrollThumbnails(this.nextIter,true);
	},
	prevItem: function() {
		this.fireEvent('onPreviousCalled');
		this.nextIter = this.currentIndex - 1;// this.currentIter-1;
		if (this.nextIter <= -1)
			this.nextIter = this.maxIter - 1;
		this.galleryInit = 0;
		this.goTo(this.nextIter);
		this.scrollThumbnails(this.nextIter,false);
	},
	goTo: function(num) {
		this.clearTimer();
		if(this.options.preloader)
		{
			this.galleryElements[num].load();
			if (num==0)
				this.galleryElements[this.maxIter - 1].load();
			else
				this.galleryElements[num - 1].load();
			if (num==(this.maxIter - 1))
				this.galleryElements[0].load();
			else
				this.galleryElements[num + 1].load();
				
		}
		
		var thumbnails = $('carouselInner').getElements('.thumbnail');
		var thumbnailsLen = thumbnails.length;
		
		if(this.isFullPreview==false){
			for(var i=0;i<thumbnailsLen;i++){
				if(i==num){
					$(thumbnails[i]).getParent('div').addClass('currentThumbnail');
				}
				else{
					$(thumbnails[i]).getParent('div').removeClass('currentThumbnail');
				}
			}
		}
		else{
			var bgImage = '';
			var re = /large(r)*/ig;
			var currentImg = this.galleryElements[num].source.replace(re,'small').toLowerCase();
			
			var reBlank = / /ig;
			currentImg = currentImg.replace(reBlank,'%20');
			for(var i=0;i<thumbnailsLen;i++){
				bgImage = thumbnails[i].style.backgroundImage.toLowerCase().replace(re,'small');
				bgImage = bgImage.replace(reBlank,'%20');
				// TSQ-11604--fixed the orange border
				//if(bgImage.indexOf(currentImg)!=-1){	
				if(i==num){
					$(thumbnails[i]).getParent('div').addClass('currentThumbnail');
				}
				else{
					$(thumbnails[i]).getParent('div').removeClass('currentThumbnail');
				}
			}
		}
		
		if (this.options.embedLinks)
			this.clearLink();
			
		var blNoChange = true;
		if (this.currentIter != num || this.reInit==true ||(this.startIndex==1&&num==0)){
			blNoChange = false;
		}
		this.changeItem(num);
		if (this.options.embedLinks)
			this.makeLink(num);
		this.prepareTimer();
		if (blNoChange==false){
			this.initTurntable(num);
		}
	},
	changeItem: function(num) {
		this.fireEvent('onStartChanging');
		this.galleryInit = 0;
		if (this.currentIter != num || this.reInit==true ||(this.startIndex==1&&num==0))
		{
			this.reInit = false;
			for(i=0;i<this.maxIter;i++)
			{
				if ((i != this.currentIter)) this.galleryElements[i].set({opacity: 0});
			}
			if(this.galleryElements[this.currentIter]){
				this.galleryElements[this.currentIter].set({opacity: 0});
			}
			this.galleryElements[num].set({opacity: 1});
			this.currentIter = num;
			if(this.isFullPreview==false){
				this.setFileSize(this.galleryElements[num].originalFileSize);
				this.setFileResolution(this.galleryElements[num]);
				//if(pageIndicator==3){
				this.setGallerySize(this.resolution);
				var rWidth = this.galleryElements[this.currentIter].standardWidth;
				if(this.resolution==2){
					rWidth = this.galleryElements[this.currentIter].HDWidth;
				}
				else if(this.resolution==3){
					rWidth = this.galleryElements[this.currentIter].originalWidth;
				}
				setArrowPositions(rWidth);
				//}
				setContainerHeight();
			}
			if(this.galleryElements[this.currentIter].loaded==false){
				if(this.galleryData[this.currentIter].lenTurntable==0){
					this.showLoading(false);
				}				
			}
			else{
				if(this.loading==true){
					this.hideLoading(num);
				}
			}
			if (this.options.useReMooz)
				this.makeReMooz();
			if(this.isFullPreview==false){
				this.clearImgDragInfo(true);
				this.showImageDragTip(false);
			}
		}
		//console.log('current:'+this.currentIter);
		this.doSlideShow.bind(this)();
		this.fireEvent('onChanged');
		if(this.isFullPreview==false){
			setContainerWidth();
		}
	},	
	
	setFileSize: function(size){
		document.getElementById('originalSize').innerHTML = '(' + size + ')';
	},
	showImageDragTip: function(justHide){		
		var dragTip = document.getElementById('hdViewImgDragTip');
		if(dragTip){
			var hasScroll = false;
			if(this.imageContainer.scrollHeight>this.imageContainer.clientHeight||this.imageContainer.scrollWidth>this.imageContainer.clientWidth){
				hasScroll = true;
			}			
			if(justHide==false && hasScroll==true && Cookie.getValue('BLSHOWHDVIEWIMGDRAGTIP')==null){
				$(dragTip).removeClass('hidden');
				Cookie.saveValue('BLSHOWHDVIEWIMGDRAGTIP','1','HDView');
				$('hdViewImgDragClose').addEvent('click',
					function () {
						$('hdViewImgDragTip').addClass('hidden');
					}
				);
			}
			else{
				if(!$(dragTip).hasClass('hidden')){
					$(dragTip).addClass('hidden');
				}
			}
		}
	},
	setFileResolution: function(file){
		document.getElementById('standardResolution').innerHTML = file.standardWidth + 'x' + file.standardHeight;
		document.getElementById('HDResolution').innerHTML = file.HDWidth + 'x' + file.HDHeight;
		document.getElementById('originalResolution').innerHTML = file.originalWidth + 'x' + file.originalHeight;
		if(file.trueOriginal){
			$('OriginalResolutionContainer').removeClass('hidden');
		}
		else{
			$('OriginalResolutionContainer').addClass('hidden');
		}
		if(file.trueHD){
			$('HDLink').removeClass('grayLink');
		}
		else{
			$('HDLink').addClass('grayLink');
		}
	},
	clearTimer: function() {
		if (this.options.timed)
			$clear(this.timer);
	},
	prepareTimer: function() {
		if (this.options.timed)
			this.timer = this.nextItem.delay(this.options.delay, this);
	},
	doSlideShow: function(position) {
		if (this.galleryInit == 1)
		{
			imgPreloader = new Image();
			imgPreloader.onload=function(){
				this.startSlideShow.delay(10, this);
			}.bind(this);
			imgPreloader.src = this.galleryData[0].image;
			if(this.options.preloader)
				this.galleryElements[0].load();
		} else {
			if (this.options.showInfopane)
			{
				if (this.options.showInfopane)
				{
					this.showInfoSlideShow.delay((500 + this.options.fadeDuration), this);
				} else
					if ((this.options.showCarousel)&&(this.options.activateCarouselScroller))
						this.centerCarouselOn(position);
			}
		}
	},
	createCarousel: function() {
		var carouselElement;
		if (!this.options.useExternalCarousel){
			var carouselContainerElement = new Element('div').addClass('carouselContainer').injectInside(this.galleryElement);
			this.carouselContainer = new Fx.Morph(carouselContainerElement, {transition: Fx.Transitions.Expo.easeOut});
			this.carouselContainer.normalHeight = carouselContainerElement.offsetHeight;
			this.carouselContainer.set({'opacity': this.options.carouselMinimizedOpacity, 'top': (this.options.carouselMinimizedHeight - this.carouselContainer.normalHeight)});
			this.carouselBtn = new Element('a').addClass('carouselBtn').setProperties({
				title: this.options.textShowCarousel
			}).injectInside(carouselContainerElement);
			if(this.options.carouselPreloader)
				this.carouselBtn.set('html', this.options.textPreloadingCarousel);
			else
				this.carouselBtn.set('html', this.options.textShowCarousel);
			this.carouselBtn.addEvent(
				'click',
				function () {
					this.carouselContainer.cancel();
					this.toggleCarousel();
				}.bind(this)
			);
			this.carouselActive = false;
	
			carouselElement = new Element('div').addClass('carousel').injectInside(carouselContainerElement);
			this.carousel = new Fx.Morph(carouselElement);
		} 
		else {
			carouselElement = $(this.options.carouselElement).addClass('jdExtCarousel');
		}
		this.carouselElement = new Fx.Morph(carouselElement, {transition: Fx.Transitions.Expo.easeOut});
		this.carouselElement.normalHeight = carouselElement.offsetHeight;
		
		
		if($('carouselWrapper')){
			var carouselWrapper = $('carouselWrapper');
		}
		else{
			var carouselWrapper = new Element('div').addClass('carouselWrapper').injectInside(carouselElement);
		}

		this.carouselWrapper = new Fx.Morph(carouselWrapper, {transition: Fx.Transitions.Expo.easeOut});
		this.carouselWrapper.normalHeight = carouselWrapper.offsetHeight;
		
		if($('carouselInner')){
			this.carouselInner = $('carouselInner');
		}
		else{
			this.carouselInner = new Element('div').addClass('carouselInner').injectInside(carouselElement);
		}

		if (this.options.activateCarouselScroller)
		{
			this.carouselWrapper.scroller = new Scroller(carouselWrapper, {
				area: 100,
				velocity: 0.2
			})
			
			this.carouselWrapper.elementScroller = new Fx.Scroll(carouselWrapper, {
				duration: 400,
				onStart: this.carouselWrapper.scroller.stop.bind(this.carouselWrapper.scroller),
				onComplete: this.carouselWrapper.scroller.start.bind(this.carouselWrapper.scroller)
			});
		}
	},
	fillCarousel: function() {
		this.constructThumbnails();
		this.carouselInner.normalWidth = ((this.maxIter * (this.options.thumbWidth + this.options.thumbSpacing + 2))+this.options.thumbSpacing) + "px";
		
		//if (this.options.carouselHorizontal)
		//	this.carouselInner.style.width = this.carouselInner.normalWidth;
	},
	initCarousel: function () {
		this.createCarousel();
		this.fillCarousel();
		if (this.options.carouselPreloader)
		   this.preloadThumbnails();
	},
	flushCarousel: function() {
		this.thumbnailElements.each(function(myFx) {
			myFx.element.dispose();
			myFx = myFx.element = null;
		});
		this.thumbnailElements = [];
	},
	toggleCarousel: function() {
		if (this.carouselActive)
			this.hideCarousel();
		else
			this.showCarousel();
	},
	showCarousel: function () {
		this.fireEvent('onShowCarousel');
		this.carouselContainer.start({
			'opacity': this.options.carouselMaximizedOpacity,
			'top': 0
		}).chain(function() {
			this.carouselActive = true;
			this.carouselWrapper.scroller.start();
			this.fireEvent('onCarouselShown');
			this.carouselContainer.options.onComplete = null;
		}.bind(this));
	},
	hideCarousel: function () {
		this.fireEvent('onHideCarousel');
		var targetTop = this.options.carouselMinimizedHeight - this.carouselContainer.normalHeight;
		this.carouselContainer.start({
			'opacity': this.options.carouselMinimizedOpacity,
			'top': targetTop
		}).chain(function() {
			this.carouselActive = false;
			this.carouselWrapper.scroller.stop();
			this.fireEvent('onCarouselHidden');
			this.carouselContainer.options.onComplete = null;
		}.bind(this));
	},
	constructThumbnails: function () {
		element = this.carouselInner;
		if(this.options.useExternalCarouselHtml==true){
			var thumbnails = $('carouselInner').getElements('.thumbnail');
			var thumbnailsLen = thumbnails.length;
		}
		var currentImg;		
		for(i=0;i<this.galleryData.length;i++)
		{
			if(this.options.useExternalCarouselHtml==false){
				currentImg = new Fx.Morph(new Element ('div').addClass("thumbnail").setStyles({
						backgroundImage: "url('" + this.galleryData[i].thumbnail + "')",
						backgroundPosition: "center center",
						backgroundRepeat: 'no-repeat',
						marginLeft: this.options.thumbSpacing + "px",
						width: this.options.thumbWidth + "px",
						height: this.options.thumbHeight + "px"
					}).injectInside(element), {duration: 200}).start({
						'opacity': 1
					});
			}
			else{
				var key = '';
				var opa = 1;
				for(var j=0;j<thumbnailsLen;j++){
					key = thumbnails[j].id.replace('sThumb','');
					if(Number(key) == Number(this.galleryData[i].key)){
						opa = 1;
						if(this.galleryData[i].grayThumb==true){
							opa = 0.3;
						}

						if(this.galleryData[i].lenTurntable>0){
							if(thumbnails[j].getElement('div')==null){
								(new Element ('div').addClass("t360").appendText(' ')).injectInside(thumbnails[j]);
							}
						}
						else{
							thumbnails[j].empty();
						}

						currentImg = new Fx.Morph(thumbnails[j], {duration: 200}).start({
								'opacity': opa
							});
						break;
					}
				}
			}
			if(i==0){
				$(currentImg.subject).getParent('div').addClass('currentThumbnail');
			}
			currentImg.element.addEventsMoo({
				'mouseover': function (myself) {
					myself.cancel();
					$(myself.subject).getParent('div').addClass('overThumbnail');
				}.pass(currentImg, this),
				'mouseout': function (myself) {
					myself.cancel();
					$(myself.subject).getParent('div').removeClass('overThumbnail');
				}.pass(currentImg, this),
				'click': function (myself) {
					this.goTo(myself.relatedImage.number);
				}.pass(currentImg, this)
			});
			
			currentImg.relatedImage = this.galleryData[i];
			this.thumbnailElements[parseInt(i)] = currentImg;
		}
	},
	log: function(value) {
		//if(console.log)
			//console.log(value);
	},
	preloadThumbnails: function() {
		var thumbnails = [];
		for(i=0;i<this.galleryData.length;i++)
		{
			thumbnails[parseInt(i)] = this.galleryData[i].thumbnail;
		}
		this.thumbnailPreloader = new Preloader();
		if (!this.options.useExternalCarousel)
			this.thumbnailPreloader.addEvent('onComplete', function() {
				var textShowCarousel = formatString(this.options.textShowCarousel, this.currentIter+1, this.maxIter);
				this.carouselBtn.set('html', textShowCarousel).setProperty('title', textShowCarousel);
			}.bind(this));
		this.thumbnailPreloader.load(thumbnails);
	},
	clearThumbnailsHighlights: function()
	{
		for(i=0;i<this.galleryData.length;i++)
		{
			this.thumbnailElements[i].cancel();
			this.thumbnailElements[i].start(0.2);
		}
	},
	changeThumbnailsSize: function(width, height)
	{
		for(i=0;i<this.galleryData.length;i++)
		{
			this.thumbnailElements[i].cancel();
			this.thumbnailElements[i].element.setStyles({
				'width': width + "px",
				'height': height + "px"
			});
		}
	},
	centerCarouselOn: function(num) {
		/*if (!this.carouselWallMode)
		{
			var carouselElement = this.thumbnailElements[num];
			var position = carouselElement.element.offsetLeft + (carouselElement.element.offsetWidth / 2);
			var carouselWidth = this.carouselWrapper.element.offsetWidth;
			var carouselInnerWidth = this.carouselInner.offsetWidth;
			var diffWidth = carouselWidth / 2;
			var scrollPos = position-diffWidth;
			this.carouselWrapper.elementScroller.start(scrollPos,0);
		}*/
	},
	initInfoSlideshow: function() {
		/*if (this.slideInfoZone.element)
			this.slideInfoZone.element.remove();*/
		this.slideInfoZone = new Fx.Morph(new Element('div').addClass('slideInfoZone').injectInside($(this.galleryElement))).set({'opacity':0});
		var slideInfoZoneTitle = new Element('h2').injectInside(this.slideInfoZone.element);
		var slideInfoZoneDescription = new Element('p').injectInside(this.slideInfoZone.element);
		this.slideInfoZone.normalHeight = this.slideInfoZone.element.offsetHeight;
		this.slideInfoZone.element.setStyle('opacity',0);
	},
	changeInfoSlideShow: function()
	{
		this.hideInfoSlideShow.delay(10, this);
		this.showInfoSlideShow.delay(500, this);
	},
	showInfoSlideShow: function() {
		this.fireEvent('onShowInfopane');
		this.slideInfoZone.cancel();
		element = this.slideInfoZone.element;
		element.getElement('h2').set('html', this.galleryData[this.currentIter].title);
		element.getElement('p').set('html', this.galleryData[this.currentIter].description);
		if(this.options.slideInfoZoneSlide)
			this.slideInfoZone.start({'opacity': [0, this.options.slideInfoZoneOpacity], 'height': [0, this.slideInfoZone.normalHeight]});
		else
			this.slideInfoZone.start({'opacity': [0, this.options.slideInfoZoneOpacity]});
		if (this.options.showCarousel)
			this.slideInfoZone.chain(this.centerCarouselOn.pass(this.currentIter, this));
		return this.slideInfoZone;
	},
	hideInfoSlideShow: function() {
		this.fireEvent('onHideInfopane');
		this.slideInfoZone.cancel();
		if(this.options.slideInfoZoneSlide)
			this.slideInfoZone.start({'opacity': 0, 'height': 0});
		else
			this.slideInfoZone.start({'opacity': 0});
		return this.slideInfoZone;
	},
	makeLink: function(num) {
		this.currentLink.setProperties({
			href: this.galleryData[num].link,
			title: this.galleryData[num].linkTitle
		})
		if (!((this.options.embedLinks) && (!this.options.showArrows) && (!this.options.showCarousel)))
			this.currentLink.setStyle('display', 'block');
	},
	clearLink: function() {
		this.currentLink.setProperties({href: '', title: ''});
		if (!((this.options.embedLinks) && (!this.options.showArrows) && (!this.options.showCarousel)))
			this.currentLink.setStyle('display', 'none');
	},
	makeReMooz: function() {
		this.currentLink.setProperties({
			href: '#'
		});
		this.currentLink.setStyles({
			'display': 'block'
		});
		
		this.galleryElements[this.currentIter].element.set('title', this.galleryData[this.currentIter].title + ' :: ' + this.galleryData[this.currentIter].description);
		this.ReMooz = new ReMooz(this.galleryElements[this.currentIter].element, {
			link: this.galleryData[this.currentIter].link,
			shadow: false,
			dragging: false,
			addClick: false,
			resizeOpacity: 1
		});
		var img = this.galleryElements[this.currentIter];
		var coords = img.element.getCoordinates();
		delete coords.right;
		delete coords.bottom;
		
		widthDiff = coords.width - img.width;
		heightDiff = coords.height - img.height;
		
		coords.width = img.width;
		coords.height = img.height;
		
		coords.left += Math.ceil(widthDiff/2)+1;
		coords.top += Math.ceil(heightDiff/2)+1;
		
		this.ReMooz.getOriginCoordinates = function(coords) {
			return coords;
		}.bind(this, coords);
		this.currentLink.onclick = function () {
			this.ReMooz.open.bind(this.ReMooz)();
			return false;
		}.bind(this);
	},
	/* To change the gallery data, those two functions : */
	flushGallery: function() {
		this.galleryElements.each(function(myFx) {
			myFx.element.dispose();
			myFx = myFx.element = null;
		});
		this.galleryElements = [];
	},
	changeData: function(data) {
		this.galleryData = data;
		this.clearTimer();
		this.flushGallery();
		if (this.options.showCarousel) this.flushCarousel();
		this.constructElements();
		if (this.options.showCarousel) this.fillCarousel();
		if (this.options.showInfopane) this.hideInfoSlideShow();
		this.galleryInit=1;
		this.lastIter=0;
		this.currentIter=0;
		this.doSlideShow(1);
	},
	/* Plugins: HistoryManager */
	initHistory: function() {
		this.fireEvent('onHistoryInit');
		this.historyKey = this.galleryElement.id + '-picture';
		if (this.options.customHistoryKey)
			this.historyKey = this.options.customHistoryKey;
		
		this.history = new History.Route({
			defaults: [1],
			pattern: this.historyKey + '\\((\\d+)\\)',
			generate: function(values) {
				return [this.historyKey, '(', values[0], ')'].join('')
			}.bind(this),
			onMatch: function(values, defaults) {
				if (parseInt(values[0])-1 < this.maxIter)
					this.goTo(parseInt(values[0])-1);
			}.bind(this)
		});
		this.addEvent('onChanged', function(){
			this.history.setValue(0, this.currentIter+1);
			this.history.defaults=[this.currentIter+1];
		}.bind(this));
		this.fireEvent('onHistoryInited');
	},
	/************   Turntable Function ***********/
	initTurntable: function(num){
		var lenT = this.galleryData[num].lenTurntable;
		this.currentIndex = num;
		this.currentAutoLoadIndex = 0;
		if(this.isFullPreview==true){
			this.setSignature(this.galleryData[num].trueHD,this.galleryData[num].trueOriginal);
			this.setFullPreviewTip(lenT>0,this.galleryData[num].trueHD);
		}
		if(lenT>0){			
			var allLoaded = false;
			this.inTurntable = true;
			if(this.isFullPreview==false){
				$('imageDrag').addClass('hidden');
			}
			var r = this.galleryData[num].turntableResolution;
			this.initPlayAction();
			this.initTurntablePlayer(lenT);
			var len = this.arrTurntable.length;
			var index = -1;
			for(var i=0;i<len;i++){
				if(this.arrTurntable[i].index==num && this.arrTurntable[i].resolution==r){
					index = i;
					this.currentTurntThumbs = this.arrTurntable[i].imgs;
					break;
				}
			}//
			if(index==-1){
				//$('tipLoading').setStyle('display','block');
				this.loadingTurntable = true;
				this.showLoading(true);
				var imgSrc = this.galleryData[num].image;
				var assetID = this.currentAssetID;
				/*var startIndex = imgSrc.length - 10;
				var dotIndex = imgSrc.lastIndexOf('.',startIndex);
				var imgPrex = imgSrc.substr(0,dotIndex);
				var imgPrex2 = imgPrex;
				imgPrex = imgPrex.substr(0,imgPrex.lastIndexOf('-'));*/
				var splitIndex = imgSrc.lastIndexOf('-');
				var imgPrex = imgSrc.substr(0,splitIndex+1);
				var imgPrex2 = imgSrc.replace(imgPrex,'');
				var startNum = imgPrex2.replace('.jpg','');
				var blContainerZero = (startNum.substr(0,1)=='0');
				startNum = parseInt(startNum);
				var imgExt = '.jpg';//imgSrc.substr(dotIndex);
				var tSrc = '';
				var obj = new Object();
				obj.index = num;
				obj.resolution = r;
				obj.imgs = [];
				var imgIndex = 0;
				var currentIndex = startNum;
				for(var i=0;i<lenT;i++){
					if(blContainerZero==true && currentIndex<10){
						tSrc = imgPrex + '0' + currentIndex + imgExt;
					}
					else{
						tSrc = imgPrex + currentIndex + imgExt;
					}
					currentIndex++;
					imgIndex = i;
					obj.imgs.push(new Asset.image(tSrc, {
						'onload'  : function(){
								if(this.currentAssetID != 0){
									if(assetID != globalCurrentAssetID){ 
										return;
									}
								}
								var len = this.arrLoadedIndex.length;
								var loadedIndex = null;
								for(var i=0;i<len;i++){
									if(this.arrLoadedIndex[i].index==num && this.arrLoadedIndex[i].resolution==r){
										loadedIndex = this.arrLoadedIndex[i];
									}
								}
								if(loadedIndex==null){
									loadedIndex = new Object();
									loadedIndex.index = num;
									loadedIndex.resolution = r;//this.resolution;
									loadedIndex.loadedLen = 0;
									loadedIndex.all = false;
									loadedIndex.loadedItem = '';
									this.arrLoadedIndex.push(loadedIndex);
								}
								loadedIndex.loadedItem += arguments[2] + ',';
								loadedIndex.loadedLen++;
								if(loadedIndex.loadedLen==lenT){
									loadedIndex.all = true;
								}
								this.fireEvent('onLoad', [num,loadedIndex.loadedLen,loadedIndex.all,'load']); 
							}.pass([num,lenT,imgIndex,r,assetID], this),
						'onerror' : function(){ 
								if(this.currentAssetID != 0){
									if(assetID != globalCurrentAssetID){ 
										return;
									}
								}
								var len = this.arrLoadedIndex.length;
								var loadedIndex = null;
								for(var i=0;i<len;i++){
									if(this.arrLoadedIndex[i].index==num && this.arrLoadedIndex[i].resolution==r){
										loadedIndex = this.arrLoadedIndex[i];
									}
								}
								if(loadedIndex==null){
									loadedIndex = new Object();
									loadedIndex.index = num;
									loadedIndex.resolution = r;//this.resolution;
									loadedIndex.loadedLen = 0;
									loadedIndex.all = false;
									loadedIndex.loadedItem = '';
									this.arrLoadedIndex.push(loadedIndex);
								}
								loadedIndex.loadedItem += arguments[2] + ',';
								loadedIndex.loadedLen++;
								if(loadedIndex.loadedLen==lenT){
									loadedIndex.all = true;
								}
								this.fireEvent('onLoad', [num,loadedIndex.loadedLen,loadedIndex.all,'err']); 
							}.pass([num,lenT,imgIndex,r,assetID], this),
						'onabort' : function (){ 
								if(this.currentAssetID != 0){
									if(assetID != globalCurrentAssetID){ 
										return;
									}
								}
								var len = this.arrLoadedIndex.length;
								var loadedIndex = null;
								for(var i=0;i<len;i++){
									if(this.arrLoadedIndex[i].index==num && this.arrLoadedIndex[i].resolution==r){
										loadedIndex = this.arrLoadedIndex[i];
									}
								}
								if(loadedIndex==null){
									loadedIndex = new Object();
									loadedIndex.index = num;
									loadedIndex.resolution = r;//this.resolution;
									loadedIndex.loadedLen = 0;
									loadedIndex.all = false;
									loadedIndex.loadedItem = '';
									this.arrLoadedIndex.push(loadedIndex);
								}
								loadedIndex.loadedItem += arguments[2] + ',';
								loadedIndex.loadedLen++;
								if(loadedIndex.loadedLen==lenT){
									loadedIndex.all = true;
								}
								this.fireEvent('onLoad', [num,loadedIndex.loadedLen,loadedIndex.all,'abort']); 
							}.pass([num,lenT,imgIndex,r,assetID], this)
					  }));
				}
				this.addEvent('onLoad',this.imgOnLoad);
				this.arrTurntable.push(obj);
			}
			else{
				var len = this.arrLoadedIndex.length;
				var item = null;
				for(var i=0;i<len;i++){
					if(this.arrLoadedIndex[i].index==num && this.arrLoadedIndex[i].resolution==r){
						item = this.arrLoadedIndex[i];
						break;
					}
				}
				if(item!=null){
					this.setTurntablePlayerLoaded(item.loadedLen);
					if(item.all==true){
						this.loadTurntableCompleted(num);
						allLoaded = true;
					}
					this.playTurntableItem(true);
					this.playingItemIndex = 0;
					$('turntablePlayItem').setStyle('display','block');
				}
			}
			this.originalDragX = document.getElementById('turntDrag').offsetLeft;
			this.originalDragY = document.getElementById('turntDrag').offsetTop;
			this.showTurntableTip(false);
			this.autoPlayTurntable(num,allLoaded);
		}
		else{
			this.inTurntable = false;
			if(this.isFullPreview==false){
				$('imageDrag').removeClass('hidden');
			}
			this.showTurntableTip(true);
			this.initPlayAction();
			$("action_Turntable").removeClass('show');
			$("action_Turntable").addClass('hidden');
		}
	},
	setSignature: function(blHD,blOriginal){
		if(blHD==true || blOriginal==true){
			if (this.isDisplayHDTips)
				$("signatureHD").setStyle('display','block');
			if(blHD==true){
				document.getElementById('resolutionValue').value = "2";
			}
			else{
				document.getElementById('resolutionValue').value = "3";
			}
		}
		else{
			$("signatureHD").setStyle('display','none');
		}
	},
	setFullPreviewTip: function(blTurntable,blHD){
		var hideHDTip = true;
		var hideTruntTip = true;
		var HDTip = document.getElementById('fullPreviewHDTip');
		var TruntTip = document.getElementById('fullPreviewTip');
		if(blHD && this.isDisplayHDTips){
			if(HDTip){
				if(Cookie.getValue('BLSHOWFULLPREVIEWHDTIP')==null){
					$(HDTip).removeClass('hidden');
					Cookie.saveValue('BLSHOWFULLPREVIEWHDTIP','1');
					$('fullPreviewHDTipClose').addEvent('click',
						function () {
							$('fullPreviewHDTip').addClass('hidden');
						}
					);
					hideHDTip = false;
				}
			}
		}
		if(TruntTip && blTurntable && hideHDTip==true){
			if(Cookie.getValue('BLSHOWFULLPREVIEWTIP')==null){
				$(TruntTip).removeClass('hidden');
				Cookie.saveValue('BLSHOWFULLPREVIEWTIP','1');
				$('fullPreviewClose').addEvent('click',
					function () {
						$('fullPreviewTip').addClass('hidden');
					}
				);
				hideTruntTip = false;
			}
		}
		if(hideHDTip && HDTip){
			if(!$(HDTip).hasClass('hidden')){
				$(HDTip).addClass('hidden');
			}
		}
		if(hideTruntTip && TruntTip){
			if(!$(TruntTip).hasClass('hidden')){
				$(TruntTip).addClass('hidden');
			}
		}
	},
	showTurntableTip: function(justHide){
		var tip = document.getElementById('hdViewTip');
		if(this.isFullPreview==false && tip){
			if(justHide==false && Cookie.getValue('BLSHOWHDVIEWTIP')==null){
				$(tip).removeClass('hidden');
				Cookie.saveValue('BLSHOWHDVIEWTIP','1','HDView');
				$('hdViewClose').addEvent('click',
					function () {
						$('hdViewTip').addClass('hidden');
					}
				);
			}
			else{
				if(!$(tip).hasClass('hidden')){
					$(tip).addClass('hidden');
				}
			}
		}
	},
	imgOnLoad: function(thumbnailIndex,loadedLen,blFinish,status){
		//debugger;//currentIndex
		//alert(loadedLen);
		if(this.currentIndex==thumbnailIndex){
			this.setTurntablePlayerLoaded(loadedLen);
			this.autoLoadTurntableImage(thumbnailIndex);
			if(blFinish==true){
				this.loadTurntableCompleted(thumbnailIndex);
				if(this.TurntableLoadingTimer!=null){
					$clear(this.TurntableLoadingTimer);
					this.TurntableLoadingTimer = null;
				}
				this.turntablePlay();
			}
		}
	},
	autoPlayTurntable: function(thumbnailIndex,allLoaded){
		if(this.TurntableLoadingTimer!=null){
			$clear(this.TurntableLoadingTimer);
			this.TurntableLoadingTimer = null;
		}
		if(allLoaded==true){
			this.turntablePlay();
		}
		else{
			this.TurntableLoadingTimer = this.autoLoadTurntableImage.periodical(80,this,thumbnailIndex);
		}
	},
	autoLoadTurntableImage: function(thumbnailIndex){
		if(this.playLoadingTurntable==true || thumbnailIndex!=this.currentIter){
			return;
		}
		var thumbs = null;
		var len = this.arrTurntable.length;
		var index = null;
		var lenIndex = this.arrLoadedIndex.length;
		var r = this.galleryData[thumbnailIndex].turntableResolution;
		for(var i=0;i<lenIndex;i++){
			if(this.arrLoadedIndex[i].index==thumbnailIndex && this.arrLoadedIndex[i].resolution==r){
				index = this.arrLoadedIndex[i];
				break;
			}
		}
		if(index==null || index.loadedItem.indexOf(this.currentAutoLoadIndex+',')==-1){
			return;
		}

		for(var i=0;i<len;i++){
			if(this.arrTurntable[i].index==thumbnailIndex && this.arrTurntable[i].resolution==r){
				thumbs = this.arrTurntable[i].imgs;
				break;
			}
		}
		if(thumbs!=null){
			if(thumbs.length>this.currentAutoLoadIndex){
				$('turntablePlayItem').setStyle('display','block');
				$('turntablePlayItemImg').src = thumbs[this.currentAutoLoadIndex].src;
				
				this.playingItemIndex = this.currentAutoLoadIndex;
				var widthStep = 0;
				if(this.playingItemIndex==thumbs.length-1){
					widthStep = 357-20;
				}
				else{
					if(this.slider!=null){
						widthStep = this.playingItemIndex*this.slider.stepWidth;
						if(widthStep>357-20){
							widthStep = 357-20;
						}
					}
				}
				
				if(this.slider!=null)
					this.slider.knob.setStyle(this.slider.property, widthStep);
				
				this.currentAutoLoadIndex++;
				/*if(index.loadedItem.indexOf(this.currentAutoLoadIndex+',')!=-1){
					this.autoLoadTurntableImage.delay(500,this,thumbnailIndex);
				}*/
			}
		}
	},
	clearSlider: function(){
		if(this.slider!=null){			
			this.slider.removeEvents();
			this.slider = null;
		}
	},
	initTurntablePlayer: function(len){
		$("action_Turntable").removeClass('hidden');
		$("action_Turntable").addClass('show');
		this.clearSlider();
		if(!isNaN(len)){
			len = parseInt(len);
		}
		//document.getElementById('originalSize').innerHTML = '';
		this.SliderStep = len;
		this.slider = new Slider(this.sliderEl, this.knob, {
			steps: len,
			range: [0, len],
			wheel: false,
			snap: true,
			onTick: function(pos){
				this.slider.knob.setStyle(this.slider.property, pos);
				if(this.playing==true){
					this.turntablePause();
				}
				this.setCurrentTurntThumbs();
				if(this.currentTurntThumbs!=null){
				//if($("btnPlay").hasClass('playGray')==false){//this.playing==false && 
					$('turntablePlayItem').setStyle('display','block');
					var curStep = Math.floor(pos/this.slider.stepWidth);
					if(curStep>this.currentTurntThumbs.length-1){
						curStep = this.currentTurntThumbs.length - 1;
					}
					this.playingItemIndex = curStep;
					//$('turntablePlayItemImg').src = this.currentTurntThumbs[curStep].src;
					this.playTurntableItem(true,false);
				//}
				}
			}.bind(this),
			onChange: function(a){
				if(this.playing==true){
					this.turntablePause();
				}
				if(this.playingItemIndex==a){
					return;
				}
				//document.getElementById('originalSize').innerHTML += a+',';
				this.setCurrentTurntThumbs();
				if(this.currentTurntThumbs!=null){
				//if($("btnPlay").hasClass('playGray')==false){//this.playing==false && 
					$('turntablePlayItem').setStyle('display','block');
					if(a>this.currentTurntThumbs.length-1){
						a = this.currentTurntThumbs.length - 1;
					}
					this.playingItemIndex = a;
					//$('turntablePlayItemImg').src = this.currentTurntThumbs[a].src;
					this.playTurntableItem(true,false);
				//}
				}
			}.bind(this),
			onComplete: function(a){
				
			}
		});		
	
		var myDrag = new Drag('turntDrag', {
			snap: 5,
			onSnap: function(el){
				
			},
			onComplete: function(el){//alert('k');return;
				if(this.playing==false){
					this.currentDragStartX = this.originalDragX;
					el.style.left = this.originalDragX + 'px';
					el.style.top = this.originalDragY + 'px';
				}
			}.bind(this),
			onDrag: function(el){
				if(this.playing==false ){
					var left = el.offsetLeft;
					if(this.currentDragStartX<left){
						var distinct = left - this.currentDragStartX;
						if(distinct>= this.slider.stepWidth){
							var step = Math.floor(distinct/this.slider.stepWidth);
							for(var i=0;i<step;i++){
								this.playTurntableNext();
							}
							this.currentDragStartX = left;
						}
					}
					else{
						var distinct = this.currentDragStartX - left;
						if(distinct>= this.slider.stepWidth){
							var step = Math.floor(distinct/this.slider.stepWidth);
							for(var i=0;i<step;i++){
								this.playTurntablePre();
							}
							
							this.currentDragStartX = left;
						}
					}
				}
			}.bind(this)
		});

		this.currentTurntThumbs = null;
		this.setTurntablePlayerLoaded(0);
	},
	setTurntablePlayerLoaded: function(len){
		var targetWidth = 0;
		if(len!=0){
			var totalWidth = document.getElementById('myElement').clientWidth;
			targetWidth = totalWidth/this.SliderStep * len;
			if(targetWidth>357){
				targetWidth = 357;
			}
		}
		$("progress").setStyle('width',targetWidth+'px');
	},
	loadTurntableCompleted: function(num){
		var thumbs = null;
		var len = this.arrTurntable.length;
		var r = this.galleryData[num].turntableResolution;
		for(var i=0;i<len;i++){
			if(this.arrTurntable[i].index==num && this.arrTurntable[i].resolution==r){
				thumbs = this.arrTurntable[i].imgs;
				break;
			}
		}
		if(thumbs!=null){
			this.loadingTurntable = false;
			this.hideLoading(-1);
			this.currentTurntThumbs = thumbs;
			//$("btnPlay").removeClass('playGray');
			$("btnPlay").removeClass('pause');
			$("btnPlay").addClass('play');
		}
	},
	setCurrentTurntThumbs: function(){
		if(this.currentTurntThumbs==null){
			var len = this.arrTurntable.length;
			for(var i=0;i<len;i++){
				if(this.arrTurntable[i].index==this.currentIter && (this.arrTurntable[i].resolution==1 || this.arrTurntable[i].resolution==this.resolution)){
					this.currentTurntThumbs = this.arrTurntable[i].imgs;
					break;
				}
			}
		}
	},
	initPlayAction: function(){
		this.stopTurntable();
		this.playingItemIndex = 0;
		//$("btnPlay").removeClass('play');
		//$("btnPlay").removeClass('pause');
		//$("btnPlay").addClass('playGray');
		$('turntablePlayItem').setStyle('display','none');
		//$('turntablePlayItemImg').setProperty('src','');
	},	
	turntablePlay: function(){
		this.setCurrentTurntThumbs();
		if(this.currentTurntThumbs!=null){
			this.playing = true;
			$("btnPlay").removeClass('play');
			$("btnPlay").addClass('pause');
			this.TurntableTimer = this.playTurntableItem.periodical(80,this);
			$('turntablePlayItem').setStyle('display','block');
		}
	},
	turntablePause: function(){
		this.stopTurntable();
		$("btnPlay").removeClass('pause');
		//$("btnPlay").removeClass('playGray');
		$("btnPlay").addClass('play');
	},
	stopTurntable: function(){
		if(this.playing==true){
			this.playing = false;			
			$clear(this.TurntableTimer);
		}
	},
	checkItemLoaded: function(num){
		var len = this.arrLoadedIndex.length;
		var item = null;
		var r = this.galleryData[num].turntableResolution;
		for(var i=0;i<len;i++){
			if(this.arrLoadedIndex[i].index==this.currentIter && this.arrLoadedIndex[i].resolution==r){
				item = this.arrLoadedIndex[i];
				break;
			}
		}
		if(item!=null){
			if(item.loadedItem.indexOf(num+',')!=-1){
				return true;
			}
		}
		return false;
	},
	playTurntableItem: function(blManual,blSetKnob){
		if(blSetKnob!=false){
			blSetKnob = true;
		}
		if(this.loadingTurntable==true){			
			this.playLoadingTurntable = true;
			if(this.checkItemLoaded(this.playingItemIndex)==false){
				this.turntablePause();
				return;
			}
		}
		if(this.playingItemIndex>=this.currentTurntThumbs.length){
			this.playingItemIndex = 0;			
			this.slider.knob.setStyle(this.slider.property, 0);
			$('turntablePlayItemImg').src = this.currentTurntThumbs[this.playingItemIndex].src;
			if(blManual!=true){
				this.playingItemIndex++;
			}
			return;
		}
		if(this.playingItemIndex==-1){
			this.playingItemIndex = 0;
		}
		$('turntablePlayItemImg').src = this.currentTurntThumbs[this.playingItemIndex].src;
		if(blManual!=true){
			this.playingItemIndex++;
		}
		//this.slider.set(this.playingItemIndex);
		var widthStep = 0;
		if(this.playingItemIndex==this.currentTurntThumbs.length-1){
			widthStep = 357-20;
		}
		else{
			widthStep = this.playingItemIndex*this.slider.stepWidth;
			if(widthStep>357-20){
				widthStep = 357-20;
			}
		}
		if(blSetKnob){
			this.slider.knob.setStyle(this.slider.property, widthStep);
		}
	},
	playTurntableNext: function(){
		if(this.playing==false && $("action_Turntable").hasClass('show')==true){
			this.setCurrentTurntThumbs();
			this.playingItemIndex++;
			if(this.playingItemIndex>=this.currentTurntThumbs.length){
				this.playingItemIndex = 0;				
			}
			this.playTurntableItem(true);
		}
	},
	playTurntablePre: function(){
		if(this.playing==false && $("action_Turntable").hasClass('show')==true){
			this.setCurrentTurntThumbs();
			this.playingItemIndex--;
			if(this.playingItemIndex<0){
				this.playingItemIndex = this.currentTurntThumbs.length - 1;
			}
			this.playTurntableItem(true);
		}
	},
	setGallerySize: function(r,w,h){
		var viewHeight = document.documentElement.clientHeight;
		if(viewHeight<200){
			viewHeight = 200;
		}		
		viewHeight = (viewHeight - 184);// 180: top,bottom margin
		if(!w){
			var keyWidth = 'HDWidth';
			var keyHeight = 'HDHeight';
			if(r==1){
				keyWidth = 'standardWidth';
				keyHeight = 'standardHeight';
			}
			else if(r==3){
				keyWidth = 'originalWidth';
				keyHeight = 'originalHeight';
			}
			var index = this.currentIter;
			if(index==1 && this.galleryElements.length==1){
				index = 0;
			}
			w = this.galleryElements[index][keyWidth];
			h = this.galleryElements[index][keyHeight];
		}
		if(w<600){
			w = 600;
		}
		var blSmaller = false;
		if(h<=viewHeight){
			h = viewHeight;
			blSmaller = true;
		}
		switch(r){
			case 1:
				w = 600;
				if(h<600){
				}
				else if(blSmaller==false){
					h = 600;
				}				
				break;
			case 2:
				/*if(h<1200){
				}
				if(blSmaller==false){
					h = 1200;
				}*/
				//w = 1200;
				break;
			case 3:
				
				break;
		}
		$('myGallery').setStyles({
			'width': w + 'px',
			'height': h + 'px'
		});
	},
	resetResolutionLink: function(r){
		var arr = ['standardLink','HDLink','originalLink'];
		var arr2 = ['standardResolution','HDResolution','originalResolution'];
		for(var i=0;i<arr.length;i++){
			if(r==i+1){
				$(arr[i]).addClass('currentLink');				
				$(arr[i]).removeClass('link');		
				$(arr2[i]).addClass('currentResolution');
			}
			else{
				$(arr[i]).addClass('link');				
				$(arr[i]).removeClass('currentLink');
				$(arr2[i]).removeClass('currentResolution');
			}
		}
	}
	/************   Turntable Function End ***********/
};

gallery = new Class(gallery);

gallery.Transitions = new Hash ({
	fade: function(oldFx, newFx, oldPos, newPos){
		oldFx.options.transition = newFx.options.transition = Fx.Transitions.linear;
		oldFx.options.duration = newFx.options.duration = this.options.fadeDuration;
		if (newPos > oldPos) newFx.start({opacity: 1});
		else
		{
			newFx.set({opacity: 1});
			oldFx.start({opacity: 0});
		}
	},
	crossfade: function(oldFx, newFx, oldPos, newPos){
		oldFx.options.transition = newFx.options.transition = Fx.Transitions.linear;
		oldFx.options.duration = newFx.options.duration = this.options.fadeDuration;
		newFx.start({opacity: 1});
		oldFx.start({opacity: 0});
	},
	fadebg: function(oldFx, newFx, oldPos, newPos){
		oldFx.options.transition = newFx.options.transition = Fx.Transitions.linear;
		oldFx.options.duration = newFx.options.duration = this.options.fadeDuration / 2;
		oldFx.start({opacity: 0}).chain(newFx.start.pass([{opacity: 1}], newFx));
	}
});

/* All code copyright 2007 Jonathan Schemoul */

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Follows: Preloader (class)
 * Simple class for preloading images with support for progress reporting
 * Copyright 2007 Tomocchino.
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

var Preloader = new Class({
  
  Implements: [Events, Options],

  options: {
    root        : '',
    period      : 100
  },
  
  initialize: function(options){
    this.setOptions(options);
  },
  
  load: function(sources) {
    this.index = 0;
    this.images = [];
    this.sources = this.temps = sources;
    this.total = this. sources.length;
    
    this.fireEvent('onStart', [this.index, this.total]);
    this.timer = this.progress.periodical(this.options.period, this);
    
    this.sources.each(function(source, index){
      this.images[index] = new Asset.image(this.options.root + source, {
        'onload'  : function(){ this.index++; if(this.images[index]) this.fireEvent('onLoad', [this.images[index], index, source]); }.bind(this),
        'onerror' : function(){ this.index++; this.fireEvent('onError', [this.images.splice(index, 1), index, source]); }.bind(this),
        'onabort' : function(){ this.index++; this.fireEvent('onError', [this.images.splice(index, 1), index, source]); }.bind(this)
      });
    }, this);
  },
  
  progress: function() {
    this.fireEvent('onProgress', [Math.min(this.index, this.total), this.total]);
    if(this.index >= this.total) this.complete();
  },
  
  complete: function(){
    $clear(this.timer);
    this.fireEvent('onComplete', [this.images]);
  },
  
  cancel: function(){
    $clear(this.timer);
  }
  
});

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Follows: formatString (function)
 * Original name: Yahoo.Tools.printf
 * Copyright Yahoo.
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

function formatString() {
	var num = arguments.length;
	var oStr = arguments[0];
	for (var i = 1; i < num; i++) {
		var pattern = "\\{" + (i-1) + "\\}"; 
		var re = new RegExp(pattern, "g");
		oStr = oStr.replace(re, arguments[i]);
	}
	return oStr; 
}


/************** Page Function **************/
function executeResizeFunctions(){
	adjustPosition();
	setGalleryCarouselWidth();
}
function isIE(){
	return navigator.userAgent.indexOf('MSIE')!=-1;
}
function isSafari(){
	return navigator.userAgent.indexOf('Safari')!=-1;
}
function isMacSafari(){
	var agent = navigator.userAgent;
	if(agent.indexOf('Safari')!=-1 && agent.indexOf('Mac OS')!=-1){
		return true;
	}
	return false;
}
function setArrowPositions(rWidth){
	if(isIE()==false){
		return;
	}
	var viewWidth = document.documentElement.clientWidth;
	var reduceWidth = 1200;
	if(rWidth && pageIndicator!=2){
		reduceWidth = rWidth;
	}
	else if(pageIndicator==1){
		reduceWidth = 600;
	}
	var leftArrow = document.getElementById("leftArrow");
	var rightArrow = document.getElementById("rightArrow");
	if(viewWidth<=reduceWidth || pageIndicator==3){
		leftArrow.style.left = "0px";
		if(isMacSafari()){			
			rightArrow.style.right = "15px";
		}
		else{
			rightArrow.style.right = "16px";
		}
	}
	else{
		var w = (viewWidth - reduceWidth)/2;
		var imgContainer = $('HDContainer');
		if(isIE()){
			leftArrow.style.left = (w-1) + "px";
			if(imgContainer.scrollHeight>imgContainer.clientHeight){
				var isIE8 = document.documentMode;
				if(isIE8){
					rightArrow.style.right = (w) + "px";
				}
				else{
					rightArrow.style.right = (w+1) + "px";
				}
			}
			else{
				rightArrow.style.right = (w) + "px";
			}
		}
		else{
			if(isMacSafari() && imgContainer.scrollHeight>imgContainer.clientHeight){
				rightArrow.style.right = (w-1) + "px";
			}
			else{
				rightArrow.style.right = (w) + "px";
			}			
			leftArrow.style.left = (w) + "px";
		}
	}
}
function adjustPosition(rWidth)
{
	setContainerHeight();
	setContainerWidth();
	
	var viewWidth = document.documentElement.clientWidth;
	var reduceWidth = 1200;
	if(rWidth){
		reduceWidth = rWidth;
	}
	else if(pageIndicator==1){
		reduceWidth = 600;
	}
	var leftArrow = document.getElementById("leftArrow");
	var rightArrow = document.getElementById("rightArrow");
	if(viewWidth<=reduceWidth || pageIndicator==3){
		leftArrow.style.left = "0px";
		if(isMacSafari()){			
			rightArrow.style.right = "15px";
		}
		else{
			rightArrow.style.right = "16px";
		}
	}
	else{
		var w = (viewWidth - reduceWidth)/2;
		var imgContainer = $('HDContainer');
		if(isIE()){
			leftArrow.style.left = (w-1) + "px";
			if(imgContainer.scrollHeight>imgContainer.clientHeight){
				var isIE8 = document.documentMode;
				if(isIE8){
					rightArrow.style.right = (w) + "px";
				}
				else{
					rightArrow.style.right = (w+1) + "px";
				}
			}
			else{
				rightArrow.style.right = (w-5) + "px";
			}
		}
		else{
			if(isMacSafari() && imgContainer.scrollHeight>imgContainer.clientHeight){
				rightArrow.style.right = (w-1) + "px";
			}
			else{
				rightArrow.style.right = (w) + "px";
			}			
			leftArrow.style.left = (w) + "px";			
		}
	}
	var loading = document.getElementById("loadingElement");
	if(loading){
		loading.style.top = leftArrow.offsetTop -21 + 'px';
	} //125 160
	var viewHeight = document.documentElement.clientHeight;
	if(viewHeight>160){
		var top = (viewHeight - 165 - 9)/2 + 165 -35;
		leftArrow.style.top = top + 'px';//'60%';
		rightArrow.style.top = top + 'px';//'60%';
		$('action_Turntable').removeClass('TurntableFixed');
	}
	else{
		leftArrow.style.top = '95px';
		rightArrow.style.top = '95px';
		$('action_Turntable').addClass('TurntableFixed');
	}

	if(viewWidth<=410){
		document.getElementById("action_Turntable").style.left = "0px";
	}
	else{
		var distinct = (viewWidth - 410) / 2;
		document.getElementById("action_Turntable").style.left = distinct + "px";
	}	

	return;
	var viewHeight = document.documentElement.clientHeight;
	var scollHeight = document.documentElement.scrollTop;
	var clickAbleTop = -1;
	if(document.getElementById("leftArrow")){
		var arrowTop = viewHeight + scollHeight;
		var imgHiddenHeight = arrowTop - 120 - viewHeight;
		if(imgHiddenHeight<0){
			imgHiddenHeight = 0;
		}
		//arrowTop = (arrowTop + 140 + imgHiddenHeight) / 2 - 35;
		arrowTop = (viewHeight + 140) / 2 - 35;
		clickAbleTop = imgHiddenHeight;
		if(arrowTop<2){
			arrowTop = 2;
		}
		document.getElementById("leftArrow").style.top = arrowTop + "px";
		document.getElementById("rightArrow").style.top = arrowTop + "px";
	}

	if(!document.getElementById("action_Turntable") || $('action_Turntable').hasClass('hidden')==true){
		return;
	}
	var top = viewHeight + scollHeight - 50;
	if(top>1320){
		top = 1320;
	}
	if(clickAbleTop>=0){
		document.getElementById("turntClickAble").style.top = clickAbleTop + "px";
	}
	//document.getElementById("action_Turntable").style.top = viewHeight + "px";
}
function setContainerWidth(){
	var container = document.getElementById('HDContainer');	
	if(container.scrollHeight>container.clientHeight){ /*verticle scrollbar*/
		container.style.paddingRight = '0px';
		//container.style.marginRight = '0px';
		//document.getElementById('originalLink').innerHTML = '0';
	}
	else{
		//if(isIE()==false){
			container.style.paddingRight = '17px';
			//document.getElementById('originalLink').innerHTML = '17';
		//}
		//else{
		//	container.style.marginRight = '21px';
		//}
	}
}
function setContainerHeight(){
	var viewHeight = document.documentElement.clientHeight;
	if(viewHeight<200){
		viewHeight = 200;
	}
	var reduce = 182;//176
	var c = document.getElementById('HDContainer'); 
	if(c.scrollWidth>c.clientWidth){	// has scroll bar
		reduce = 182 - 14;
	}
	//document.getElementById('HDContainer').style.height = (viewHeight - reduce) + 'px';
}
function setGalleryCarouselWidth(){
	//var viewWidth = document.documentElement.clientWidth - 160;
	var viewWidth = document.documentElement.clientWidth - 15 - 18;
	if(isIE()){
		if(viewWidth<960){		
			viewWidth = 960;
		}
	}
	else{
		if(viewWidth<900){		
			viewWidth = 900;
		}
	}
	document.getElementById("galleryCarousel").style.width = viewWidth + 'px';
}

var Cookie = {
	saveValue: function(key,value,path){
		var expdate = new Date();
		expdate.setFullYear(expdate.getFullYear() + 30);	
		if (path != null)
			var path = "/" + path + '/';
		else
			var path = "/";
		var domain = null;
		var secure = false;
		document.cookie = key + "=" + escape (value) +("; expires="+ expdate.toGMTString())
		+((path == null) ? "" : ("; path=" + path)) +((domain == null) ? "" : ("; domain=" + domain))
		+((secure == true) ? "; secure" : "");
	},
	getValue: function(key){
		var arg = key + "=";
		var alen = arg.length;
		var clen = document.cookie.length;
		var i = 0;
		while (i < clen)
		{
			var j = i + alen;
			if (document.cookie.substring(i, j) == arg)
			return this._get(j);
			
			i = document.cookie.indexOf(" ", i) + 1;
			if (i == 0) break;
		}
		return null;
	},
	_get: function(offset){
		var endstr = document.cookie.indexOf (";", offset);
		if (endstr == -1)
			endstr = document.cookie.length;
		return unescape(document.cookie.substring(offset, endstr));
	}
}