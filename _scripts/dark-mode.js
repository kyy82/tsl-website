{
  // immediately load saved (or default) mode before page renders
  document.documentElement.dataset.dark =
    window.localStorage.getItem("dark-mode") ?? "false";

  const onLoad = () => {

    const onLoad = () => {
      // Find the toggle button
      const darkToggle = document.querySelector(".dark-toggle");
      
      // Only update if the element exists
      if (darkToggle) {
        darkToggle.checked = document.documentElement.dataset.dark === "true";
      }
    };
  };

  // after page loads
  window.addEventListener("load", onLoad);

  // when user toggles mode button
  window.onDarkToggleChange = (event) => {
    const value = event.target.checked;
    document.documentElement.dataset.dark = value;
    window.localStorage.setItem("dark-mode", value);
  };
}
