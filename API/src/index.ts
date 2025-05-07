import express, { json, urlencoded } from 'express';
import productsRoutes from './routes/products/index';
import usersRoutes from './routes/users/index';
import profilesRoutes from './routes/profiles/index';
import businessesRoutes from './routes/businesses/index';
import promoCodesRoutes from './routes/promo-codes/index';
import productOrdersRoutes from './routes/product-orders/index';
import eventsRoutes from './routes/events/index';
import ticketsRoutes from './routes/tickets/index';
import ticketOrdersRoutes from './routes/ticket-orders/index';
import ticketResalesRoutes from './routes/ticket-resales/index';
import storiesRoutes from './routes/stories/index';
import guestListsRoutes from './routes/guest-lists/index';
import qrScansRoutes from './routes/qr-scans/index';
import resaleRatingsRoutes from './routes/resale-ratings/index';
import postsRoutes from './routes/posts/index';
import videosRoutes from './routes/videos/index';
import imagesRoutes from './routes/images/index';
import commentsRoutes from './routes/comments/index';
import likesRoutes from './routes/likes/index';
import subscriptionsRoutes from './routes/subscriptions/index';
import conversationsRoutes from './routes/conversations/index';
import messagesRoutes from './routes/messages/index';
import attachmentsRoutes from './routes/attachments/index';

const app = express();
const port = 3000;

app.use(urlencoded({ extended: false }));
app.use(json());

app.get('/', (req, res) => {
  res.send('Hello World! 123');
});


app.use('/products', productsRoutes); //food and bev or merch?
app.use('/users', usersRoutes); //just me and you using the app
app.use('/profiles', profilesRoutes); //not too sure yet
app.use('/businesses', businessesRoutes); // event organisers and merchants
app.use('/promo-codes', promoCodesRoutes); //discounts from the app for loyal customers/refunds/or merchants & organisers
app.use('/product-orders', productOrdersRoutes); //users ordering products from merchants
app.use('/events', eventsRoutes); //linked to businesses (specifically event organisers) or promo events for merchants selling in real-time
app.use('/tickets', ticketsRoutes); //linked to events and organisers
app.use('/ticket-orders', ticketOrdersRoutes); //linked to tickets-events-users
app.use('/ticket-resales', ticketResalesRoutes); //users selling to users
app.use('/stories', storiesRoutes); //posts on stories-events-products
app.use('/guest-lists', guestListsRoutes); //access at events
app.use('/qr-scans', qrScansRoutes); //tickets at events
app.use('/resale-ratings', resaleRatingsRoutes); //ticket resale ratings of process
app.use('/posts', postsRoutes); //used to show products-events-content (regular or ads)
app.use('/videos', videosRoutes); //posts-products-events
app.use('/images', imagesRoutes); //posts-products-events-messages
app.use('/comments', commentsRoutes); //posts-events-products
app.use('/likes', likesRoutes); //posts-events-products
app.use('/subscriptions', subscriptionsRoutes); //subscription to app deals-like uber one
app.use('/conversations', conversationsRoutes); //between users for resale or for merchants (support) or drivers or app for support
app.use('/messages', messagesRoutes); //between users for resale or for merchants (support) or drivers or app for support
app.use('/attachments', attachmentsRoutes); //between users for resale or for merchants (support) or for support

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
