(function() {
  const WidgetWhiz = {
    init: function(config) {
      const botId = config.botId;
      const origin = window.location.origin; // This will be the origin of the script, but we need the origin of the app
      // Since the script is hosted on the app, we can find its source
      const scripts = document.getElementsByTagName('script');
      let appOrigin = '';
      for (let i = 0; i < scripts.length; i++) {
        if (scripts[i].src.includes('widget.js')) {
          appOrigin = new URL(scripts[i].src).origin;
          break;
        }
      }

      const container = document.createElement('div');
      container.id = 'widgetwhiz-container';
      container.style.position = 'fixed';
      container.style.bottom = '0';
      container.style.right = '0';
      container.style.zIndex = '999999';
      container.style.width = '300px';
      container.style.height = '200px';
      container.style.pointerEvents = 'none';
      container.style.transition = 'width 0.3s, height 0.3s';

      const iframe = document.createElement('iframe');
      iframe.src = `${appOrigin}/widget?botId=${botId}`;
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.style.background = 'transparent';
      iframe.style.pointerEvents = 'auto';

      container.appendChild(iframe);
      document.body.appendChild(container);

      window.addEventListener('message', function(event) {
        if (event.origin !== appOrigin) return;
        if (event.data && event.data.type === 'WIDGET_STATE') {
          if (event.data.isOpen) {
            container.style.width = '420px';
            container.style.height = '620px';
          } else {
            container.style.width = '300px';
            container.style.height = '200px';
          }
        }
      });
    }
  };
  window.WidgetWhiz = WidgetWhiz;
})();
