import * as Environment from "~/node_common/environment";
import * as Strings from "~/common/strings";
import * as Constants from "~/node_common/constants";

import JWT from "jsonwebtoken";

export const decodeCookieToken = (token) => {
  try {
    const decoded = JWT.verify(token, Environment.JWT_SECRET);
    return decoded.id;
  } catch (e) {
    console.log(e.message);
    return null;
  }
};

export const parseAuthHeader = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  var matches = value.match(/(\S+)\s+(\S+)/);
  return matches && { scheme: matches[1], value: matches[2] };
};
