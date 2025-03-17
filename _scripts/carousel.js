/* _scripts/carousel.js */

{
    const onLoad = () => {
      const carousel = document.querySelector('.carousel');
      if (!carousel) return;
      
      const items = carousel.querySelectorAll('.carousel-item');
      const prevButton = document.querySelector('.carousel-control.prev');
      const nextButton = document.querySelector('.carousel-control.next');
      const indicators = document.querySelectorAll('.carousel-indicator');
      
      let currentIndex = 0;
      let autoplayInterval;
      const totalItems = items.length;
      
      // Set first indicator as active
      if (indicators.length > 0) {
        indicators[0].classList.add('active');
      }
      
      // Function to update carousel position
      const updateCarousel = (index) => {
        if (index < 0) index = totalItems - 1;
        if (index >= totalItems) index = 0;
        
        currentIndex = index;
        carousel.style.transform = `translateX(-${currentIndex * 100}%)`;
        
        // Update active indicator
        indicators.forEach((indicator, i) => {
          if (i === currentIndex) {
            indicator.classList.add('active');
          } else {
            indicator.classList.remove('active');
          }
        });
      };
      
      // Click events for controls
      if (prevButton) {
        prevButton.addEventListener('click', () => {
          resetAutoplay();
          updateCarousel(currentIndex - 1);
        });
      }
      
      if (nextButton) {
        nextButton.addEventListener('click', () => {
          resetAutoplay();
          updateCarousel(currentIndex + 1);
        });
      }
      
      // Click events for indicators
      indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
          resetAutoplay();
          updateCarousel(index);
        });
      });
      
      // Touch support
      let touchStartX = 0;
      let touchEndX = 0;
      
      const handleTouchStart = (e) => {
        touchStartX = e.touches[0].clientX;
      };
      
      const handleTouchEnd = (e) => {
        touchEndX = e.changedTouches[0].clientX;
        handleSwipe();
      };
      
      const handleSwipe = () => {
        const swipeThreshold = 50;
        if (touchStartX - touchEndX > swipeThreshold) {
          // Swipe left
          resetAutoplay();
          updateCarousel(currentIndex + 1);
        } else if (touchEndX - touchStartX > swipeThreshold) {
          // Swipe right
          resetAutoplay();
          updateCarousel(currentIndex - 1);
        }
      };
      
      carousel.addEventListener('touchstart', handleTouchStart);
      carousel.addEventListener('touchend', handleTouchEnd);
      
      // Autoplay
      const startAutoplay = () => {
        autoplayInterval = setInterval(() => {
          updateCarousel(currentIndex + 1);
        }, 5000); // Change slide every 5 seconds
      };
      
      const resetAutoplay = () => {
        clearInterval(autoplayInterval);
        startAutoplay();
      };
      
      // Start autoplay when the page loads
      startAutoplay();
      
      // Reset autoplay when the user interacts with the page
      window.addEventListener('focus', startAutoplay);
      window.addEventListener('blur', () => clearInterval(autoplayInterval));
      
      // Pause autoplay when hovering over the carousel
      carousel.addEventListener('mouseenter', () => clearInterval(autoplayInterval));
      carousel.addEventListener('mouseleave', startAutoplay);
    };
    
    // After page loads
    window.addEventListener('load', onLoad);
  }