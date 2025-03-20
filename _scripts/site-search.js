
{
  window.onSiteSearchSubmit = (event) => {
    event.preventDefault();
    const google = "https://www.google.com/search?q=site:";
    const site = window.location.origin;
    const query = event.target.elements.query.value;
    window.location = google + site + " " + query;
  };
}
