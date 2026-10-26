//39. este es el router del module prganizations
import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";

import type { CreateOrganizationWithOwnerService } from "../../organizations/create-organization-with-owner-service";

export function createOrganizationRoutes(
  onboardingService: CreateOrganizationWithOwnerService,
  requireAuth: any,
) {
  const router = Router();

  router.post(
    "/",
    requireAuth,
    async (
      request: Request,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const result = await onboardingService.execute(
          {
            name: request.body?.name,
            slug: request.body?.slug,
          },
          request.user.id,
        );

        response.status(201).json(result);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
