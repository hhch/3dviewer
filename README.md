# 3dviewer
This is a cool html/js 3D images viewer. It works well in hybrid mobile projects too.

- Html/Javascript
- jd.gallery (JonDesign's SmoothGallery v2.1beta1)
- mootools-1.2.1-core-yc
- Samples Images: diesel PACCAR MX

[![License](http://img.shields.io/:license-mit-blue.svg?style=flat-square)](http://badges.mit-license.org)

[![Sample](https://github.com/jonasgozdecki/3dviewer/blob/master/engine.gif)]()

---

## Contents

- [Code](#code)
- [Plugin](#plugin)
- [Clone](#clone)
- [Setup](#setp)
- [License](#license)


## Code

```javascript

var imagesFolder = "images/";
			var blHD = true;
			//var myData = <-- Feed here with your images like source 'index.htm'
function startGallery(){
	var myGallery = new gallery($('myGallery'), {
		timed: false,showInfopane:false,useExternalCarousel:true,useExternalCarouselHtml:true
		,carouselElement:'galleryCarousel',embedLinks:false,showCarouselLabel:false
		,thumbIdleOpacity:0.6,useExternalArrow:true,resolution:2
		,startIndex:1
	});
}
var pageIndicator = 2; // 1. 600x600, 2. 1200x1200, 3. original;
window.addEvent('domready',startGallery);
```

---

### Plugin

Main Developer: Jonathan Schemoul (JonDesign: http://www.jondesign.net/)
Contributed code by:
- Christian Ehret (bugfix)
- Nitrix (bugfix)
- Valerio from Mad4Milk for his great help with the carousel scrolling and many other things.
- Archie Cowan for helping me find a bugfix on carousel inner width problem.
- Tomocchino from #mootools for the preloader class

Many thanks to:
- The mootools team for the great mootools lib.
- Harald Kirschner (digitarald: http://digitarald.de/) for all his great libs. Some used here as plugins.
	
---

### Clone

- Clone this repo to your local machine using `https://github.com/jonasgozdecki/3dviewer.git`

### Setup

- Clone and change images as you want:

> Images Folder Location

```shell
//var myData = <-- Feed here with your images like source 'index.htm'
```


## License

[![License](http://img.shields.io/:license-mit-blue.svg?style=flat-square)](http://badges.mit-license.org)

- **[MIT license](http://opensource.org/licenses/mit-license.php)**

