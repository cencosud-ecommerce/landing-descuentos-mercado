require("./index.css");

(function($, Fizzmod, window, undefined) {
    // Counter for load more products - Start with 20 by is the default render items
    let numberCollection = parseInt(
        $(".search-filter:first-child").attr("collection")
    );
    let isRequesting = false;
    let currentPage = 1;
    let activeRequest = null;
    let loader = $(elem.shelfLoader);
    let loader_more = $(".loader_more .loader");

    loader.fadeIn(250);

    getCategoriesFilters(`?map=c&fq=H:${numberCollection}`)
        .done(filters => {
            if (filters.CategoriesTrees.length > 0) {
                //let collectionId = window.location.search.split(":")[1].split("&O")[0];
                let collectionId = numberCollection;
                let category = filters.CategoriesTrees;
                for (let i = 0; i < filters.CategoriesTrees.length; i++) {
                    let childrenCat = category[i].Children;
                    for (let j = 0; j < category[i].Children.length; j++) {
                        renderButtonCategory(
                            collectionId,
                            childrenCat[j].Name,
                            childrenCat[j].Link
                        );
                    }
                }
            }
        })
        .fail(e => console.log("Hubo un error", e));

    getCollectionByNumber(numberCollection, currentPage, 15);

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

    
    // Handle events for buttons
    $(".shelf-header .search-list-filters").on("click", function(e) {
        currentPage = 1;
        var $element = $(e.target).closest("button");
        numberCollection = parseInt($element.attr("collection"));
        $element
            .addClass("active")
            .siblings()
            .removeClass("active");
        loader.fadeIn(250);
        $(".product-shelf ul").empty();
        let link = $element.attr("link");

        // Get all the products in the first button, the others is to filter
        if ($element[0].id == "view-all-products") {
            getCollectionByNumber(numberCollection, currentPage, 20);
        } else {
            getFilteredProducts(link, numberCollection);
        }
    });

    /**
     *
     * @param {Integer} Integer - Ingeger of Collection to render
     * @param {Ingeger} quantity - Ingeger of how many products should be rendered
     */
    function getCollectionByNumber(number, page, quantity) {
        isRequesting = true;

        if (activeRequest) {
            activeRequest.abort();
        }

        activeRequest = Aurora.getProductShelf(`fq=H:${number}`,page,quantity,18)
            .done(res => {
                if ( res != "" && !$.isEmptyObject(res) &&typeof res.activeElement == "undefined" ) {

                    // Find necessary html (product list)
                    let products = $(res).find("> ul > li");
                    // Append it into the ul tag
                    $(elem.productShelf).find("ul:first").append(products);
                    
                    loader.fadeOut(250);
                    loader_more.fadeOut(250);

                    // Add flags
                    var flagDiscount = $(".discount-percent");

                    for (var i = 0; i < flagDiscount.length; i++) {
                        var discountPercent = parseFloat(flagDiscount[i].innerText);

                        if (discountPercent >= 10) {
							flagDiscount[i].innerText = discountPercent + "%";
                            flagDiscount[i].style.display = "flex";
                        }
                    }
                    isRequesting = false;
                    
                }
            })
            .fail(error => {
                console.clear()
                console.error("Error loading more products",error);
                $(".product-shelf ul").empty();
				$(".product-shelf").append("<p>Hay un problema cargando los productos, recarga la página o vuelve a intentarlo más tarde</p>");
                setTimeout(() => {
                    $(".product-shelf ul").empty();
                    getCollectionByNumber(number, page, quantity)
                }, 3000);
            });
    }

    /**
     *
     * @param {Ingeger} filterByCategory
     * @param {String} iconForCategory
     * @param {String} descriptionCategory
     * @param {String} textCategory
     */
    function renderButtonCategory(filterByCategory,textCategory,linkToFilter) {
        let buttonToAdd = `<button link=${linkToFilter} collection=${filterByCategory} type="button" class="search-filter"><span class="text">${textCategory}</span></button>`;

        $(".search-list-filters").append(buttonToAdd);
	}
	
    /**
     *
     * @param {String} params - Query for search in Vtex API
     * @param {*} def
     * @param {Ingeger} retries
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
                    getCategoriesFilters(params, def, retries);
                } else {
                    def.reject();
                }
            });

        return def.promise();
    }

	/**
	 * 
	 * @param {String} url 
	 * @param {Ingeger} collectionId 
	 * @param {*} xhr 
	 * @param {*} retries 
	 */
    function getFilteredProducts(url, collectionId, xhr = null, retries = 0) {
        if (!url || !collectionId)
            return console.log("'url or collectionID' is not defined");

        if (!xhr) xhr = $.Deferred();

        let request = $.get( url + "/" + collectionId + "?O=OrderByPriceDESC&PS=18&map=c,c,c,productClusterIds",
            "",
            "",
            "html"
        )
            .done(res => {
                try {
                    // Spitting html code to render it later
                    // Look for class endend with "colunas"
                    var a = res.split("colunas")[1];
                    // Look for the end of </ul> inside of product-shelf class
                    var b = a.split('<div class="pager bottom"')[0];
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
                } catch (e) {
                    $(".product-shelf ul").html(
                        "<p>Hay un problema cargando los productos, vuelve a intentarlo más tarde</p>"
                    );
                    setTimeout(() => {
                        getFilteredProducts(url, collectionId, xhr, retries);
                    }, 3000);
                }
            })
            .fail(jqxhr => {
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

        promise.abort = function() {
            request.abort();
        };

        return promise;
    }

    $(window).scroll(function() {
		if($(this).scrollTop() + window.innerHeight > $(elem.shelfContent).offset().top + $(elem.shelfContent).height() && $("#view-all-products").hasClass("active") && !isRequesting ){

			setTimeout(() => {
                    currentPage = currentPage + 1;
            }, 500);
            
            // Activate loader when request are in course
            loader.fadeIn(250);
			loader_more.fadeIn(250);
			
            getCollectionByNumber(numberCollection, currentPage, 15);
            // Get the products
        }
    });
})(jQuery, Fizzmod, window);
