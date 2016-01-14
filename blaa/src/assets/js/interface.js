//Interfaz grafica
$(document).ready(function(){
	loadSliderBig();
	loadGeneralCarousel();
	loadSlider75();
	loadFancyVideo();
	loadCSelect();
});

//select custom
function loadCSelect(){
	var customSelect = $('.customSelect');
	if(customSelect.length){
		customSelect.each(function(){
			$(this).selectmenu({appendTo:$(this).parent()});
		});
	}
}

//fancy video
function loadFancyVideo(){
	var openVideo = $('.openVideo');
	if(openVideo.length){
		openVideo.colorbox({iframe:true,opacity:'0.75',width:'780px',height:'460px'});
	}
}

//slider big
function loadSliderBig(){
	var sliderBig = $('.sliderBig');
	if(sliderBig.length){
		sliderBig.cycle({
			slides:'> article',swipe:true,swipeFx:'scrollHorz',fx:'scrollHorz',log:false,speed:750,
			prev:sliderBig.parents('.contBanner').find('.btnPrev'),
			next:sliderBig.parents('.contBanner').find('.btnNext'),
			pager:sliderBig.parents('.contBanner').find('.contPager')
		});
	}
}

//carousel general
function loadGeneralCarousel(){
	var gCarousel = $('.gCarousel');
	if(gCarousel.length){
		gCarousel.each(function(){
			$(this).cycle({
				slides:'> article',paused:true,swipe:true,swipeFx:'carousel',fx:'carousel',carouselVisible:3,carouselFluid:true,log:false,
				prev:$(this).parents('.contCarousel').find('.btnPrev'),
				next:$(this).parents('.contCarousel').find('.btnNext'),
				pager:$(this).parents('.contCarousel').find('.contPager')
			});
		});
	}
}

//slider 75
function loadSlider75(){
	var gSlider75 = $('.gSlider75');
	if(gSlider75.length){
		gSlider75.each(function(){
			$(this).cycle({
				slides:'> article',paused:true,swipe:true,swipeFx:'scrollHorz',fx:'scrollHorz',log:false,speed:750,
				prev:$(this).parents('.contCarousel').find('.btnPrev'),
				next:$(this).parents('.contCarousel').find('.btnNext'),
				pager:$(this).parents('.contCarousel').find('.contPager')
			});
		});
	}
}