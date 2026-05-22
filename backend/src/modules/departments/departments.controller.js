import { StatusCodes } from "http-status-codes";
import { departmentsService } from "./departments.service.js";

export const departmentsController = {
	async listDepartments(req, res) {
		const departments = await departmentsService.listDepartments({
			accessToken: req.accessToken,
			includeInactive: req.query.includeInactive,
		});

		return res.status(StatusCodes.OK).json({
			success: true,
			departments,
		});
	},

	async createDepartment(req, res) {
		const department = await departmentsService.createDepartment({
			accessToken: req.accessToken,
			payload: req.body,
		});

		return res.status(StatusCodes.CREATED).json({
			success: true,
			data: department,
		});
	},

	async updateDepartment(req, res) {
		const department = await departmentsService.updateDepartment({
			accessToken: req.accessToken,
			departmentSlug: req.params.departmentSlug,
			payload: req.body,
		});

		return res.status(StatusCodes.OK).json({
			success: true,
			data: department,
		});
	},

	async setDepartmentActive(req, res) {
		const department = await departmentsService.setDepartmentActive({
			accessToken: req.accessToken,
			departmentSlug: req.params.departmentSlug,
			isActive: req.body.isActive,
		});

		return res.status(StatusCodes.OK).json({
			success: true,
			data: department,
		});
	},

	async updateDepartmentLogo(req, res) {
		const department = await departmentsService.updateDepartmentLogo({
			accessToken: req.accessToken,
			departmentSlug: req.params.departmentSlug,
			file: req.file,
		});

		return res.status(StatusCodes.OK).json({
			success: true,
			data: department,
		});
	},

	async deleteDepartmentLogo(req, res) {
		const department = await departmentsService.deleteDepartmentLogo({
			accessToken: req.accessToken,
			departmentSlug: req.params.departmentSlug,
		});

		return res.status(StatusCodes.OK).json({
			success: true,
			data: department,
		});
	},

	async deleteDepartment(req, res) {
		const department = await departmentsService.deleteDepartment({
			accessToken: req.accessToken,
			departmentSlug: req.params.departmentSlug,
			cleanup: req.query.cleanup,
			reassignTo: req.query.reassignTo,
		});

		return res.status(StatusCodes.OK).json({
			success: true,
			data: department,
		});
	},
};
