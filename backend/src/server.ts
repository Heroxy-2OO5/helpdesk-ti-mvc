import { app } from './app.js';
import { environment } from './config/environment.js';

app.listen(environment.port, () => {
  console.info(
    `Backend HelpDesk TI disponible en http://localhost:${environment.port}`,
  );
});
