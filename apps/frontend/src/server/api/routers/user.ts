import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "@/server/api/trpc";

export const userRouter = createTRPCRouter({
	register: publicProcedure
		.input(
			z.object({
				name: z.string().min(2, "Name must be at least 2 characters").max(100),
				email: z.string().email("Invalid email address").max(255),
				password: z
					.string()
					.min(8, "Password must be at least 8 characters")
					.max(128),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Registration is only allowed when no users exist
			const userCount = await ctx.db.user.count();
			if (userCount > 0) {
				// Use generic error message to prevent user enumeration
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Registration is not available.",
				});
			}

			// Check if user already exists (edge case - shouldn't happen if userCount is 0)
			const existingUser = await ctx.db.user.findUnique({
				where: { email: input.email },
			});

			if (existingUser) {
				// Use same generic error message to prevent user enumeration
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Registration is not available.",
				});
			}

			// Hash the password
			const hashedPassword = await bcrypt.hash(input.password, 12);

			// Create the user as admin (first user is always admin)
			const user = await ctx.db.user.create({
				data: {
					name: input.name,
					email: input.email,
					password: hashedPassword,
					role: "ADMIN",
				},
			});

			return {
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
			};
		}),

	me: protectedProcedure.query(async ({ ctx }) => {
		const user = await ctx.db.user.findUnique({
			where: { id: ctx.session.user.id },
			select: {
				id: true,
				name: true,
				email: true,
				image: true,
				role: true,
				createdAt: true,
			},
		});

		return user;
	}),
});
