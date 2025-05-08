import * as usersSchema from "./entities/usersSchema";
import * as sandboxUserSchema from "./entities/sandboxUserSchema";
import { userStatusEnum, subscriptionStatusEnum } from "./entities/enums"; // Import the enums
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
import * as postsSchema from "./entities/postsSchema";
import * as videosSchema from "./entities/videosSchema";
import * as imagesSchema from "./entities/imagesSchema";
import * as commentsSchema from "./entities/commentsSchema";
import * as likesSchema from "./entities/likesSchema";
import * as followersSchema from "./entities/followersSchema"; // Changed import from subscriptionsSchema
import * as subscriptionsSchema from "./entities/subscriptionsSchema"; // Added import for new subscriptionsSchema
import * as conversationsSchema from "./entities/conversationsSchema";
import * as messagesSchema from "./entities/messagesSchema";
import * as attachmentsSchema from "./entities/attachmentsSchema";
import * as postMediaSchema from "./entities/postMediaSchema"; // Added import for postMediaSchema

export default {
  ...usersSchema,
  ...sandboxUserSchema,
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
  ...postsSchema,
  ...videosSchema,
  ...imagesSchema,
  ...commentsSchema,
  ...likesSchema,
  ...followersSchema, // Changed export from subscriptionsSchema
  ...subscriptionsSchema, // Added export for new subscriptionsSchema
  ...conversationsSchema,
  ...messagesSchema,
  ...attachmentsSchema,
  ...postMediaSchema, // Added export for postMediaSchema
  subscriptionStatusEnum, // Export the new enum
};
