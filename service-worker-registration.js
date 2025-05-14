if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('ServiceWorker зарегистрирован успешно:', registration.scope);


        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {

              if (confirm('Доступна новая версия приложения. Обновить сейчас?')) {
                window.location.reload();
              }
            }
          });
        });
      })
      .catch(error => {
        console.error('Ошибка при регистрации ServiceWorker:', error);
      });


    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}