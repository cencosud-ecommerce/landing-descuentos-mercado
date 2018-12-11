require("./index.css");

$(function() {
  // Counter for load more products - Start with 20 by is the default render items
  var cont = 20;
  var numberCollection = 698;


  // Slider
  /*const $slider = $('.swiper-wrapper');

  if ($slider.is(':empty')) {
  	$slider.hide().parent().addClass('empty');
  } else if ($slider.children().length > 1) {
    $slider.bxSlider({
      prevText: '',
      nextText: '',
      auto: true
    });
  }*/

  var loader = $(elem.shelfLoader);
  loader.fadeIn(250);

  getCollectionByNumber(numberCollection, 20);

  $(document).on("click", elem.searchListFiltersSlideControls, function() {
    let t = $(this);
    let sliderWrapper = $(elem.searchListFilters);
    let slideScrollLeft = sliderWrapper.scrollLeft();
    let delta = 130;
    let newScrollLeft = 0;

    if (t.hasClass("prev")) {
      newScrollLeft = slideScrollLeft - delta;
    }
    if (t.hasClass("next")) {
      newScrollLeft = slideScrollLeft + delta;
    }

    sliderWrapper.animate({
      scrollLeft: newScrollLeft
    });
  });

  if (Aurora.isMobile()) {
    $(".search-list-filters").slick({
      infinite: true,
      slidesToShow: 1,
      slidesToScroll: 1,
      centerMode: true
    });
  }

  $("#banner-with-popup-instructions .adaptive-image").on("click", function(e) {
    $("#instructions-to-buy").show();
  });

  $("#instructions-to-buy button").on("click", function(e) {
    $("#instructions-to-buy").hide();
  });

  // Handle events for categories
  $(".shelf-header .search-list-filters").on("click", function(e) {
    var $element = $(e.target).closest("button");
    cont = 20;
    numberCollection = parseInt($element.attr("collection"));
    $element
      .addClass("active")
      .siblings()
      .removeClass("active");
    loader.fadeIn(250);
    $(".product-shelf").empty();
    getCollectionByNumber(numberCollection, 20);
  });

  function getCollectionByNumber(number, quantity) {
    Aurora.getProductShelf(`fq=H:${number}`, 1, quantity, 20)
      .done(res => {
        if (
          res != "" &&
          !$.isEmptyObject(res) &&
          typeof res.activeElement == "undefined"
        ) {
          $(".product-shelf").html(res);
          loader.fadeOut(250);

          // Add flags
          var flagDiscount = $(".discount-percent");

          for (var i = 0; i < flagDiscount.length; i++) {
            var discountPercent = parseFloat(flagDiscount[i].innerText);

            if (discountPercent >= 10) {
              flagDiscount[i].innerText = discountPercent + "%";
              flagDiscount[i].style.display = "flex";
            }
          }
        }
      })
      .fail(er => console.log("error"));
  }


  function getCategoryByCollection(){
    
  }

  $(window).scroll(function() {
    if (
      $(window).scrollTop() + $(window).height() >
      $(document).height() - 1000
    ) {
      cont += 5;
      loader.fadeIn(250);
      getCollectionByNumber(numberCollection, cont);
    }
  });
});
