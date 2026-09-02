/**
 * Generates a GTM container import for Discovery Platform analytics.
 * Placeholders: G-XXXXXXXXXX / GTM-XXXXXXX — replace after GA4/GTM provisioning.
 */
const fs = require("fs");
const path = require("path");

const MEASUREMENT_ID = "G-XXXXXXXXXX";
const GTM_PUBLIC_ID = "GTM-XXXXXXX";

const EVENT_PARAMS = [
  "page_path",
  "page_location",
  "page_title",
  "route_group",
  "funnel_step",
  "persona",
  "user_type",
  "user_id",
  "merchant_id",
  "merchant_slug",
  "merchant_type",
  "city",
  "content_type",
  "discover_category",
  "order_kind",
  "sign_up_method",
  "sign_in_method",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "experiment_id",
  "variant",
  "search_term",
  "item_list_name",
  "payment_type",
  "promo_type",
];

function dlv(name) {
  return {
    accountId: "0",
    containerId: "0",
    variableId: String(name),
    name: `DLV - ${name}`,
    type: "v",
    parameter: [
      { type: "INTEGER", key: "dataLayerVersion", value: "2" },
      { type: "BOOLEAN", key: "setDefaultValue", value: "false" },
      { type: "TEMPLATE", key: "name", value: name },
    ],
    fingerprint: String(name),
    formatValue: {},
  };
}

function customEventTrigger(id, eventName) {
  return {
    accountId: "0",
    containerId: "0",
    triggerId: String(id),
    name: eventName,
    type: "CUSTOM_EVENT",
    customEventFilter: [
      {
        type: "EQUALS",
        parameter: [
          { type: "TEMPLATE", key: "arg0", value: "{{_event}}" },
          { type: "TEMPLATE", key: "arg1", value: eventName },
        ],
      },
    ],
    fingerprint: String(id),
  };
}

function eventParamsList(names) {
  return names.map((name) => ({
    type: "MAP",
    map: [
      { type: "TEMPLATE", key: "name", value: name },
      { type: "TEMPLATE", key: "value", value: `{{DLV - ${name}}}` },
    ],
  }));
}

function ga4EventTag(tagId, eventName, triggerId, ecommerce = false) {
  return {
    accountId: "0",
    containerId: "0",
    tagId: String(tagId),
    name: `GA4 Event - ${eventName}`,
    type: "gaawe",
    parameter: [
      {
        type: "BOOLEAN",
        key: "sendEcommerceData",
        value: ecommerce ? "true" : "false",
      },
      ...(ecommerce
        ? [
            {
              type: "TEMPLATE",
              key: "getEcommerceDataFrom",
              value: "dataLayer",
            },
          ]
        : []),
      { type: "TEMPLATE", key: "eventName", value: eventName },
      {
        type: "LIST",
        key: "eventParameters",
        list: eventParamsList(EVENT_PARAMS),
      },
      {
        type: "TEMPLATE",
        key: "measurementIdOverride",
        value: MEASUREMENT_ID,
      },
    ],
    fingerprint: String(tagId),
    firingTriggerId: [String(triggerId)],
    tagFiringOption: "ONCE_PER_EVENT",
    monitoringMetadata: { type: "MAP" },
    consentSettings: { consentStatus: "NOT_SET" },
  };
}

const events = [
  { name: "page_view", ecommerce: false },
  { name: "sign_up", ecommerce: false },
  { name: "login", ecommerce: false },
  { name: "search", ecommerce: false },
  { name: "view_item_list", ecommerce: false },
  { name: "view_item", ecommerce: true },
  { name: "add_to_cart", ecommerce: true },
  { name: "begin_checkout", ecommerce: true },
  { name: "add_payment_info", ecommerce: false },
  { name: "purchase", ecommerce: true },
  { name: "merchant_profile_completed", ecommerce: false },
  { name: "merchant_listing_created", ecommerce: false },
  { name: "merchant_promo_published", ecommerce: false },
  { name: "merchant_first_order", ecommerce: false },
  { name: "merchant_order_received", ecommerce: false },
  { name: "ga4_user_set", ecommerce: false },
  { name: "ga4_user_clear", ecommerce: false },
];

let nextId = 1;
const tags = [];
const triggers = [];
const variables = EVENT_PARAMS.map((n) => {
  const id = nextId++;
  const v = dlv(n);
  v.variableId = String(id);
  v.fingerprint = String(id);
  return v;
});

// Config tag
const configTagId = nextId++;
const allPagesTriggerId = "2147479553";
tags.push({
  accountId: "0",
  containerId: "0",
  tagId: String(configTagId),
  name: "GA4 - Configuration",
  type: "googtag",
  parameter: [
    { type: "TEMPLATE", key: "tagId", value: MEASUREMENT_ID },
    {
      type: "LIST",
      key: "configSettingsTable",
      list: [
        {
          type: "MAP",
          map: [
            { type: "TEMPLATE", key: "parameter", value: "send_page_view" },
            { type: "TEMPLATE", key: "parameterValue", value: "false" },
          ],
        },
      ],
    },
  ],
  fingerprint: String(configTagId),
  firingTriggerId: [allPagesTriggerId],
  tagFiringOption: "ONCE_PER_EVENT",
  monitoringMetadata: { type: "MAP" },
  consentSettings: { consentStatus: "NOT_SET" },
});

// Set / Clear user tags use dedicated triggers
const setUserTriggerId = nextId++;
const clearUserTriggerId = nextId++;
triggers.push(customEventTrigger(setUserTriggerId, "ga4_user_set"));
triggers.push(customEventTrigger(clearUserTriggerId, "ga4_user_clear"));

const setUserTagId = nextId++;
tags.push({
  accountId: "0",
  containerId: "0",
  tagId: String(setUserTagId),
  name: "GA4 - Set User",
  type: "googtag",
  parameter: [
    { type: "TEMPLATE", key: "tagId", value: MEASUREMENT_ID },
    {
      type: "LIST",
      key: "configSettingsTable",
      list: [
        {
          type: "MAP",
          map: [
            { type: "TEMPLATE", key: "parameter", value: "send_page_view" },
            { type: "TEMPLATE", key: "parameterValue", value: "false" },
          ],
        },
        {
          type: "MAP",
          map: [
            { type: "TEMPLATE", key: "parameter", value: "user_id" },
            {
              type: "TEMPLATE",
              key: "parameterValue",
              value: "{{DLV - user_id}}",
            },
          ],
        },
      ],
    },
    {
      type: "LIST",
      key: "userProperties",
      list: [
        {
          type: "MAP",
          map: [
            { type: "TEMPLATE", key: "name", value: "user_type" },
            {
              type: "TEMPLATE",
              key: "value",
              value: "{{DLV - user_type}}",
            },
          ],
        },
      ],
    },
  ],
  fingerprint: String(setUserTagId),
  firingTriggerId: [String(setUserTriggerId)],
  tagFiringOption: "ONCE_PER_EVENT",
  monitoringMetadata: { type: "MAP" },
  consentSettings: { consentStatus: "NOT_SET" },
});

const clearUserTagId = nextId++;
tags.push({
  accountId: "0",
  containerId: "0",
  tagId: String(clearUserTagId),
  name: "GA4 - Clear User",
  type: "googtag",
  parameter: [
    { type: "TEMPLATE", key: "tagId", value: MEASUREMENT_ID },
    {
      type: "LIST",
      key: "configSettingsTable",
      list: [
        {
          type: "MAP",
          map: [
            { type: "TEMPLATE", key: "parameter", value: "send_page_view" },
            { type: "TEMPLATE", key: "parameterValue", value: "false" },
          ],
        },
        {
          type: "MAP",
          map: [
            { type: "TEMPLATE", key: "parameter", value: "user_id" },
            { type: "TEMPLATE", key: "parameterValue", value: "" },
          ],
        },
      ],
    },
  ],
  fingerprint: String(clearUserTagId),
  firingTriggerId: [String(clearUserTriggerId)],
  tagFiringOption: "ONCE_PER_EVENT",
  monitoringMetadata: { type: "MAP" },
  consentSettings: { consentStatus: "NOT_SET" },
});

for (const ev of events) {
  if (ev.name === "ga4_user_set" || ev.name === "ga4_user_clear") continue;
  const triggerId = nextId++;
  const tagId = nextId++;
  triggers.push(customEventTrigger(triggerId, ev.name));
  tags.push(ga4EventTag(tagId, ev.name, triggerId, ev.ecommerce));
}

const container = {
  exportFormatVersion: 2,
  exportTime: "2026-09-01 15:00:00",
  containerVersion: {
    path: "accounts/0/containers/0/versions/0",
    accountId: "0",
    containerId: "0",
    containerVersionId: "0",
    name: "Discovery Platform GA4 wiring",
    container: {
      path: "accounts/0/containers/0",
      accountId: "0",
      containerId: "0",
      name: "Discovery Platform",
      publicId: GTM_PUBLIC_ID,
      usageContext: ["WEB"],
      fingerprint: "0",
      tagIds: [GTM_PUBLIC_ID],
    },
    tag: tags,
    trigger: triggers,
    variable: variables,
    builtInVariable: [
      { accountId: "0", containerId: "0", type: "EVENT", name: "Event" },
      { accountId: "0", containerId: "0", type: "PAGE_URL", name: "Page URL" },
      {
        accountId: "0",
        containerId: "0",
        type: "PAGE_PATH",
        name: "Page Path",
      },
      {
        accountId: "0",
        containerId: "0",
        type: "PAGE_HOSTNAME",
        name: "Page Hostname",
      },
    ],
  },
};

const outDir = path.join(
  "C:",
  "Users",
  "User",
  "Desktop",
  "_Aux",
  "user-business-web",
  "docs",
  "gtm",
);
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, "discovery-platform-container-import.json"),
  JSON.stringify(container, null, 2),
);
console.log("Wrote GTM import to", outDir);
