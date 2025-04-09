document.addEventListener('DOMContentLoaded', function() {
  // Only initialize particles on the home page
  if (!document.body.classList.contains('home-page')) {
    return;
  }
  
  // Check if particlesJS exists
  if (typeof particlesJS === 'undefined') {
    console.error('particlesJS is not defined');
    return;
  }
  
  // Check if the container exists
  const container = document.getElementById('particles-js');
  if (!container) {
    console.error('particles-js container not found');
    return;
  }
  
  particlesJS('particles-js', {
    particles: {
      number: {
        value: 90,
        density: {
          enable: true,
          value_area: 800
        }
      },
      color: {
        value: '#5b5b5b'
      },
      shape: {
        type: 'circle',
        stroke: {
          width: 0,
          color: '#5b5b5b'
        },
      },
      opacity: {
        value: 0.35,
        random: false,
        anim: {
          enable: false
        }
      },
      size: {
        value: 3,
        random: true,
        anim: {
          enable: false
        }
      },
      line_linked: {
        enable: true,
        distance: 150,
        color: '#5b5b5b',
        opacity: 0.25,
        width: 1
      },
      move: {
        enable: true,
        speed: 1.2,
        direction: 'none',
        random: false,
        straight: false,
        out_mode: 'out',
        bounce: false,
        attract: {
          enable: false
        }
      }
    },
    interactivity: {
      detect_on: 'canvas',
      events: {
        onhover: {
          enable: true,
          mode: 'grab'
        },
        onclick: {
          enable: true,
          mode: 'push'
        },
        resize: true
      },
      modes: {
        grab: {
          distance: 140,
          line_linked: {
            opacity: 0.5
          }
        },
        push: {
          particles_nb: 3
        }
      }
    },
    retina_detect: true
  });
}); 