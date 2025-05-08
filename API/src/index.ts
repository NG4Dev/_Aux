import express, { json, urlencoded } from 'express';
import productsRoutes from './routes/products/index';
import usersRoutes from './routes/users/index';
import businessesRoutes from './routes/businesses/index';
import promoCodesRoutes from './routes/promo-codes/index';
import productOrdersRoutes from './routes/product-orders/index';
import eventsRoutes from './routes/events/index';
import ticketsRoutes from './routes/tickets/index';
import ticketOrdersRoutes from './routes/ticket-orders/index';
import ticketResalesRoutes from './routes/ticket-resales/index';
import guestListsRoutes from './routes/guest-lists/index';
import qrScansRoutes from './routes/qr-scans/index';
import resaleRatingsRoutes from './routes/resale-ratings/index';
import postsRoutes from './routes/posts/index';
import videosRoutes from './routes/videos/index';
import imagesRoutes from './routes/images/index';
import commentsRoutes from './routes/comments/index';
import likesRoutes from './routes/likes/index';
import followersRoutes from './routes/followers/index'; // Changed import name
import subscriptionsRoutes from './routes/subscriptions/index'; // Added import for new subscriptions route
import conversationsRoutes from './routes/conversations/index';
import messagesRoutes from './routes/messages/index';
import attachmentsRoutes from './routes/attachments/index';
import guestUsersRoutes from './routes/guest-users/index'; // Added import for guest-users route
import postMediaRoutes from './routes/post-media/index'; // Added import for post-media route
import productCategoriesRoutes from './routes/product-categories/index'; // Added import for product-categories route
import eventCategoriesRoutes from './routes/event-categories/index'; // Added import for event-categories route

const app = express();
const port = 3000;

app.use(urlencoded({ extended: false }));
app.use(json());

app.get('/', (req, res) => {
  res.send('Hello World! 123');
});


app.use('/products', productsRoutes); //food and bev or merch?
app.use('/users', usersRoutes); //just me and you using the app
app.use('/businesses', businessesRoutes); // event organisers and merchants
app.use('/promo-codes', promoCodesRoutes); //discounts from the app for loyal customers/refunds/or merchants & organisers
app.use('/product-orders', productOrdersRoutes); //users ordering products from merchants
app.use('/events', eventsRoutes); //linked to businesses (specifically event organisers) or promo events for merchants selling in real-time
app.use('/tickets', ticketsRoutes); //linked to events and organisers
app.use('/ticket-orders', ticketOrdersRoutes); //linked to tickets-events-users
app.use('/ticket-resales', ticketResalesRoutes); //users selling to users
app.use('/guest-lists', guestListsRoutes); //access at events
app.use('/qr-scans', qrScansRoutes); //tickets at events
app.use('/resale-ratings', resaleRatingsRoutes); //ticket resale ratings of process
app.use('/posts', postsRoutes); //used to show products-events-content (regular or ads)
app.use('/videos', videosRoutes); //posts-products-events
app.use('/images', imagesRoutes); //posts-products-events-messages
app.use('/comments', commentsRoutes); //posts-events-products
app.use('/likes', likesRoutes); //posts-events-products
app.use('/followers', followersRoutes); // Following users/businesses
app.use('/subscriptions', subscriptionsRoutes); // App subscriptions
app.use('/conversations', conversationsRoutes); //between users for resale or for merchants (support) or drivers or app for support
app.use('/messages', messagesRoutes); //between users for resale or for merchants (support) or drivers or app for support
app.use('/attachments', attachmentsRoutes); //between users for resale or for merchants (support) or for support
app.use('/guest-users', guestUsersRoutes); // Guest users route
app.use('/post-media', postMediaRoutes); // Post media route
app.use('/product-categories', productCategoriesRoutes); // Product categories route
app.use('/event-categories', eventCategoriesRoutes); // Event categories route

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
