{
  window.addEventListener('load', () => {
    const projectTags = document.querySelectorAll('.tags a.tag');
    const projectCards = document.querySelectorAll('.project-card');
    
    let activeTags = new Set();
    
    let clearButton;
    const tagsContainer = document.querySelector('.tags');
    
    if (tagsContainer) {
      clearButton = document.querySelector('.clear-filters');
      
      if (!clearButton) {
        clearButton = document.createElement('button');
        clearButton.textContent = 'Clear Filters';
        clearButton.className = 'clear-filters button';
        clearButton.style.marginLeft = '10px';
        clearButton.style.display = 'none'; // Hide initially
        clearButton.style.backgroundColor = '#e74c3c'; // Red background
        clearButton.style.color = 'white';
        clearButton.style.border = 'none';
        clearButton.style.borderRadius = '999px'; // Match the tag's border-radius
        clearButton.style.padding = '5px 10px'; // Match the tag's padding
        clearButton.style.fontSize = '0.9rem'; // Match the tag's font size
        clearButton.style.fontFamily = 'inherit'; // Match the tag's font family
        clearButton.style.cursor = 'pointer';
        
        clearButton.addEventListener('click', function() {
          // Clear all active tags
          projectTags.forEach(tag => {
            tag.removeAttribute('data-active');
          });
          activeTags.clear();
          
          // Show all projects
          filterProjects();
          
          // Hide the clear button
          this.style.display = 'none';
        });
        
        tagsContainer.appendChild(clearButton);
      }
    }
    
    // add click event listener to each tag
    projectTags.forEach(tag => {
      // prevent the default behavior of the anchor tag
      tag.addEventListener('click', function(e) {
        e.preventDefault();
        
        // get the tag text content (the tag name)
        const tagName = this.textContent.trim().toLowerCase();
        
        // clear all other active tags first
        projectTags.forEach(t => {
          t.removeAttribute('data-active');
        });
        activeTags.clear();
        
        // toggle the active status of the clicked tag
        if (this.hasAttribute('data-active')) {
          this.removeAttribute('data-active');
          activeTags.delete(tagName);
        } else {
          this.setAttribute('data-active', '');
          activeTags.add(tagName);
        }
        
        // filter projects based on active tags
        filterProjects();
        
        // Update clear button visibility
        if (clearButton) {
          clearButton.style.display = activeTags.size > 0 ? 'inline-block' : 'none';
        }
      });
    });
    
    // function to filter projects based on active tags
    function filterProjects() {
      // if no tags are active, show all projects
      if (activeTags.size === 0) {
        projectCards.forEach(card => {
          card.style.display = '';
        });
        return;
      }
      
      // for each project card
      projectCards.forEach(card => {
        // get all tags in this project card
        const cardTags = Array.from(card.querySelectorAll('.project-tag'))
          .map(span => span.textContent.trim().toLowerCase());
        
        // check if any active tag is in the card's tags
        const shouldShow = Array.from(activeTags).some(tag => 
          cardTags.includes(tag)
        );
        
        // show or hide based on the result
        card.style.display = shouldShow ? '' : 'none';
      });
    }
  });
}