const Group = require("../../models/Group");
const Invite = require("../../models/Invite");
const User = require("../../models/User");
const customResponse = require("../../utils/responseHandler");

const sendInvite = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const userId = req?.user?.userId;
    const inviteeId = req.body.inviteeId;

    if (!inviteeId) {
      return customResponse(res, 400, "Invitee Id required");
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return customResponse(res, 404, "Group not found");
    }

    const isMember = group.members.some(
      (member) => member.user._id.toString() === inviteeId.toString()
    );

    if (isMember) {
      return customResponse(
        res,
        403,
        "Cannot invite someone who is already a member"
      );
    }

    const isAdminOrCoAdmin =
      group.admin.toString() === userId.toString() ||
      group.coAdmins.includes(userId);

    if (!isAdminOrCoAdmin) {
      return customResponse(
        res,
        403,
        "Only admins or co-admins can send invites"
      );
    }

    const existingInvite = await Invite.findOne({
      group: groupId,
      invitee: inviteeId,
      status: "pending",
    });
    if (existingInvite) {
      return customResponse(
        res,
        400,
        "An invite is already pending for this user"
      );
    }

    const newInvite = new Invite({
      group: groupId,
      inviter: userId,
      invitee: inviteeId,
    });

    await newInvite.save();

    return customResponse(res, 200, "Invite sent successfully", newInvite);
  } catch (error) {
    console.error("Error sending invite:", error);
    return customResponse(res, 500, "Internal server error");
  }
};

const getInvites = async (req, res) => {
  try {
    const userId = req?.user?.userId;

    const Invites = await Invite.find({ invitee: userId });

    if (!Invites) {
      return customResponse(res, 200, "No invites yet");
    }

    return customResponse(res, 200, "Get all invite successfull", Invites);
  } catch (error) {
    console.log("Error in getting invites", error);
    return customResponse(res, 500, "Internal server error");
  }
};

const acceptInvite = async (req, res) => {
  try {
    const userId = req?.user?.userId;
    const { inviteId } = req.body;

    const invite = await Invite.findById(inviteId);

    if (!invite) {
      return customResponse(res, 400, "Invite not found");
    }

    // if (invite.status !== "pending") {
    //   customResponse(res, 400, "This invite is no longer valid");
    // }

    if (invite.invitee.toString() !== userId.toString()) {
      return customResponse(
        res,
        403,
        "You are not authorized to accept this invite"
      );
    }

    const group = await Group.findById(invite.group);
    if (!group) {
      return customResponse(res, 404, "Group not found");
    }

    const isMember = group.members.some(
      (member) => member.user._id.toString() === userId.toString()
    );

    if (isMember) {
      return customResponse(res, 403, "Already a member");
    }

    group.members.push({ user: userId, role: "member" });
    group.memberCount = group.members.length; // Update member count
    await group.save();

    invite.status = "accepted";
    await invite.save();

    await User.findByIdAndUpdate(userId, {
      $push: { joinedGroups: group._id },
    });

    return customResponse(res, 200, "Invite accepted successfully");
  } catch (error) {
    console.error("Error accepting invite:", error);
    return customResponse(res, 500, "Internal server error");
  }
};

const rejectInvite = async (req, res) => {
  try {
    const userId = req.user.userId; // Current user rejecting the invite
    const inviteId = req.params.inviteId; // The invite to be rejected

    // Find the invite by ID and check if it's valid and pending
    const invite = await Invite.findById(inviteId);
    if (!invite) {
      customResponse(res, 404, "Invite not found");
    }

    if (invite.status !== "pending") {
      return customResponse(res, 400, "This invite is no longer valid");
    }

    // Check if the invitee is the same as the current user
    if (invite.invitee.toString() !== userId.toString()) {
      return customResponse(
        res,
        403,
        "You are not authorized to reject this invite"
      );
    }

    // Update the invite status to "rejected"
    invite.status = "rejected";
    await invite.save();

    return customResponse(res, 200, "Invite rejected successfully");
  } catch (error) {
    console.error("Error rejecting invite:", error);
    return customResponse(res, 500, "Internal server error");
  }
};

module.exports = { sendInvite, getInvites, acceptInvite, rejectInvite };
