require("./index.css");

$(function() {
  // Counter for load more products - Start with 20 by is the default render items
  var cont = 20;
  var numberCollection = parseInt($(".search-filter:first-child").attr("collection"));

  getCategoriesFilters(`?map=c&fq=H:${numberCollection}`)
    .done(filters => {
      if(filters.CategoriesTrees.length > 0){
        //let collectionId = window.location.search.split(":")[1].split("&O")[0];
        let collectionId = numberCollection;
        let category = filters.CategoriesTrees;
        for(let i=0;i<filters.CategoriesTrees.length;i++){
          let childrenCat = category[i].Children; 
          for(let j=0; j<category[i].Children.length;j++){
            renderButtonCategory(collectionId,childrenCat[j].Name,childrenCat[j].Link); 
          }
        }
      }
    })
    .fail(e => console.log("Hubo un error", e));

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
    let link = $element.attr("link");
    if($element[0].id == "view-all-products"){
      getCollectionByNumber(numberCollection, 20);
    }else{
      getFilteredProducts(link,numberCollection);
    }
    
  });

  /**
   * 
   * @param {Number} number - Number of Collection to render 
   * @param {Number} quantity - Number of how many products should be rendered
   */
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

  /**
   * 
   * @param {Number} filterByCategory 
   * @param {String} iconForCategory 
   * @param {String} descriptionCategory 
   * @param {String} textCategory 
   */
  function renderButtonCategory(filterByCategory, textCategory, linkToFilter){
    let buttonToAdd = `<button link=${linkToFilter} collection=${filterByCategory} type="button" class="search-filter"><span class="text">${textCategory}</span></button>`;

    $(".search-list-filters").append(buttonToAdd)
  }
  /**
   * 
   * @param {String} params - Query for search in Vtex API
   * @param {*} def 
   * @param {Number} retries 
   */
  function getCategoriesFilters(params, def = null, retries = 0) {
    if (def == null) {
      def = $.Deferred();
    }

    $.get("/api/catalog_system/pub/facets/search/categorias/" + params)
      .done(res => {
        def.resolve(res);
      })
      .fail(() => {
        if (retries < 3) {
          retries++;
          self.getCategoriesFilters(params, def, retries);
        } else {
          def.reject();
        }
      });

    return def.promise();
  }

  function getFilteredProducts(url, collectionId, xhr = null, retries = 0) {
    if (!url || !collectionId)
        return console.log("'url or collectionID' is not defined");

    if (!xhr)
        xhr = $.Deferred();

    let request = $.get(url +"/"+ collectionId + "?O=OrderByPriceDESC&PS=18&map=c,c,c,productClusterIds", "", "", "html")
        .done(res => {
            try{
              // Spitting html code to render it later
              // Look for class endend with "colunas"
              var a = res.split("colunas")[1];
              // Look for the end of </ul> inside of product-shelf class
              var b = a.split('<div class=\"pager bottom\"')[0];
              // Remove 12 lasts characters
              var c = b.slice(0, -12);
              // Remove 2 firsts characters
              var d = c.substr(2);

              // Resolve promise
              xhr.resolve(d);

              // Render into Dom
              $(".product-shelf").html(d);

              // Close loader spinner
              loader.fadeOut(250);
            }catch(e){
              $(".product-shelf").html("<p>Hay un problema cargando los productos, vuelve a intentarlo más tarde</p>");
              setTimeout(() => {
                getFilteredProducts(url, collectionId, xhr, retries)
              }, 3000);
            }
        })
        .fail((jqxhr) => {
            // Abort
            if (jqxhr.status == 0) {
                xhr.reject();
            } else {
                if (retries < 3) {
                    retries++;
                    getFilteredProducts(url, collectionId, xhr, retries);
                } else {
                    xhr.reject();
                }
            }
        });

    let promise = xhr.promise();

    promise.abort = function () {
        request.abort();
    }

    return promise;
}

  $(window).scroll(function() {
    if (
      $(window).scrollTop() + $(window).height() >
      $(document).height() - 1000 && $("#view-all-products").hasClass("active")
    ) {
      cont += 5;
      loader.fadeIn(250);
      getCollectionByNumber(numberCollection, cont);
    }
  });
});
