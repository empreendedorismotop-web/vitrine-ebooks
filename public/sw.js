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

self.addEventListener('notificationclick', async (event) => {
  event.notification.close();

  // 1. Grava o clique no banco (Atualiza a coluna last_active)
  const endpoint = event.notification.data.endpoint;
  await fetch('/api/push/track-click', {
    method: 'POST',
    body: JSON.stringify({ endpoint }),
    headers: { 'Content-Type': 'application/json' }
  });

  // 2. Abre o link de destino
  event.waitUntil(clients.openWindow(event.notification.data.url));
});