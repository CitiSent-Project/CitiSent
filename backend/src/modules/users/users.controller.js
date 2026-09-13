import { StatusCodes } from "http-status-codes";
import { usersService } from "./users.service.js";

export const usersController = {
  async getCurrentUser(req, res) {
    const result = await usersService.getCurrentUser(req.user, req.accessToken);

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  },

  async updateCurrentUser(req, res) {
    const result = await usersService.updateCurrentUser(
      req.user,
      req.body,
      req.accessToken,
    );

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  },

  async deleteCurrentUser(req, res) {
    const result = await usersService.deleteCurrentUser(req.user);

    return res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  },

  async exportCurrentUser(req, res) {
    const data = await usersService.exportCurrentUser(req.user, req.accessToken);

    res.setHeader("Content-Disposition", 'attachment; filename="my_citisent_data.json"');
    res.setHeader("Content-Type", "application/json");
    
    return res.status(StatusCodes.OK).send(JSON.stringify(data, null, 2));
  },
};
