import axiosInstance from "@/utils/axiosInstance";

const isHex24 = (s) => typeof s === "string" && /^[a-f0-9]{24}$/i.test(s);

export async function verifyEducationRow(targetUserId, eduId, review = {}) {
  if (!isHex24(targetUserId) || !isHex24(eduId)) {
    return {
      success: false,
      error: "Invalid IDs: target user or education ID is malformed.",
    };
  }

  const rating = Number(review.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return {
      success: false,
      error: "A star rating between 1 and 5 is required to Veridate.",
    };
  }

  const body = { rating };
  if (typeof review.comment === "string") {
    body.comment = review.comment.trim();
  }

  try {
    const url = `/verify/profiles/${encodeURIComponent(
      targetUserId
    )}/verify/education/${encodeURIComponent(eduId)}`;
    const { data } = await axiosInstance.post(url, body);

    return {
      success: true,
      data: data, // contains {verifier, target, education}
      error: null,
    };
  } catch (e) {
    const message =
      e?.response?.data?.message ||
      e?.response?.data?.error ||
      "Failed to process education verification request.";

    return {
      success: false,
      data: null,
      error: message,
    };
  }
}

export async function verifyExperienceRow(targetUserId, expId, review = {}) {
  if (!isHex24(targetUserId) || !isHex24(expId)) {
    return {
      success: false,
      error: "Invalid IDs: target user or experience ID is malformed.",
    };
  }

  const rating = Number(review.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return {
      success: false,
      error: "A star rating between 1 and 5 is required to Veridate.",
    };
  }

  const body = { rating };
  if (typeof review.comment === "string") {
    body.comment = review.comment.trim();
  }

  try {
    const url = `/verify/profiles/${encodeURIComponent(
      targetUserId
    )}/verify/experience/${encodeURIComponent(expId)}`;
    const { data } = await axiosInstance.post(url, body);

    return {
      success: true,
      data: data, // contains {verifier, target, experience}
      error: null,
    };
  } catch (e) {
    const message =
      e?.response?.data?.message ||
      e?.response?.data?.error ||
      "Failed to process experience verification request.";

    return {
      success: false,
      data: null,
      error: message,
    };
  }
}
