import * as usersSchema from "./entities/usersSchema";
import * as profilesSchema from "./entities/profilesSchema";
import * as businessesSchema from "./entities/businessesSchema";
import * as productsSchema from "./entities/productsSchema";
import * as promoCodesSchema from "./entities/promoCodesSchema";
import * as productOrdersSchema from "./entities/productOrdersSchema";
import * as eventsSchema from "./entities/eventsSchema";
import * as ticketsSchema from "./entities/ticketsSchema";
import * as ticketOrdersSchema from "./entities/ticketOrdersSchema";
import * as ticketResalesSchema from "./entities/ticketResalesSchema";
import * as guestListsSchema from "./entities/guestListsSchema";
import * as qrScansSchema from "./entities/qrScansSchema";
import * as resaleRatingsSchema from "./entities/resaleRatingsSchema";
import * as storiesSchema from "./entities/storiesSchema";
import * as postsSchema from "./entities/postsSchema";
import * as videosSchema from "./entities/videosSchema";
import * as imagesSchema from "./entities/imagesSchema";
import * as commentsSchema from "./entities/commentsSchema";
import * as likesSchema from "./entities/likesSchema";
import * as subscriptionsSchema from "./entities/subscriptionsSchema";
import * as conversationsSchema from "./entities/conversationsSchema";
import * as messagesSchema from "./entities/messagesSchema";
import * as attachmentsSchema from "./entities/attachmentsSchema";

export default {
  ...usersSchema,
  ...profilesSchema,
  ...businessesSchema,
  ...productsSchema,
  ...promoCodesSchema,
  ...productOrdersSchema,
  ...eventsSchema,
  ...ticketsSchema,
  ...ticketOrdersSchema,
  ...ticketResalesSchema,
  ...guestListsSchema,
  ...qrScansSchema,
  ...resaleRatingsSchema,
  ...storiesSchema,
  ...postsSchema,
  ...videosSchema,
  ...imagesSchema,
  ...commentsSchema,
  ...likesSchema,
  ...subscriptionsSchema,
  ...conversationsSchema,
  ...messagesSchema,
  ...attachmentsSchema,
};
