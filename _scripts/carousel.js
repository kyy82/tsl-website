/* _scripts/carousel.js */
{
    const onLoad = () => {
      console.log("Carousel script loaded and running");
      const carousel = document.querySelector('.carousel');
      if (!carousel) return;
      
      const items = carousel.querySelectorAll('.carousel-item');
      const prevButton = document.querySelector('.carousel-control.prev');
      const nextButton = document.querySelector('.carousel-control.next');
      
      if (items.length === 0) return;
      
      // Number of items to scroll at once (can be adjusted)
      const scrollCount = 1;
      let currentPosition = 0;
      const totalItems = items.length;
      
      // Function to update carousel position
      const updateCarousel = (direction) => {
        // Calculate new position
        if (direction === 'next') {
          currentPosition = Math.min(currentPosition + scrollCount, totalItems - scrollCount);
        } else {
          currentPosition = Math.max(currentPosition - scrollCount, 0);
        }
        
        // Calculate the scroll amount as a percentage
        const itemWidth = items[0].offsetWidth + parseInt(window.getComputedStyle(items[0]).marginRight);
        const scrollAmount = itemWidth * currentPosition;
        
        // Apply the transform
        carousel.style.transform = `translateX(-${scrollAmount}px)`;
        
        // Update button states
        if (prevButton) {
          prevButton.disabled = currentPosition === 0;
          prevButton.style.opacity = currentPosition === 0 ? 0.5 : 1;
        }
        
        if (nextButton) {
          const isEnd = currentPosition >= totalItems - scrollCount;
          nextButton.disabled = isEnd;
          nextButton.style.opacity = isEnd ? 0.5 : 1;
        }
      };
      
      // Click events for controls
      if (prevButton) {
        prevButton.addEventListener('click', () => updateCarousel('prev'));
      }
      
      if (nextButton) {
        nextButton.addEventListener('click', () => updateCarousel('next'));
      }
      
      // Initialize button states
      updateCarousel('init');
    };
    
    // After page loads
    window.addEventListener('load', onLoad);
}