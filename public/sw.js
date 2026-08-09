self.addEventListener('push', function (event) {
  if (event.data) {
    try {
      const data = event.data.json();
      
      const options = {
        body: data.body,
        // Removi a exigência de um ícone específico para evitar que a notificação quebre
        vibrate: [100, 50, 100],
        requireInteraction: true, // Força a notificação a ficar na tela até a pessoa fechar
        data: {
          url: data.url || '/'
        },
      };
      
      event.waitUntil(self.registration.showNotification(data.title, options));
    } catch (e) {
      console.error("Erro ao montar a notificação: ", e);
    }
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(clients.openWindow(event.notification.data.url));
  }
});