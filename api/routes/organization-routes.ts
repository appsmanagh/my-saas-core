//39. este es el router del module organizations

import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";

import type { OrganizationService } from "../../organizations/organization-service";
import type { CreateOrganizationWithOwnerService } from "../../organizations/create-organization-with-owner-service";

import { UnauthorizedError } from "../../errors";

export function createOrganizationRoutes(
  organizationService: OrganizationService,
  onboardingService: CreateOrganizationWithOwnerService,
  requireAuth: any,
) {
  const router = Router();

  //40. GET /api/organizations
  // Lista únicamente las organizaciones del usuario autenticado.
  router.get(
    "/",
    requireAuth,
    async (
      request: Request,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        if (!request.user) {
          throw new UnauthorizedError("Authentication required");
        }
        const organizations =
          await organizationService.findOrganizationsByUserId(
            request.user.id,
          );

        response.status(200).json({ organizations });
      } catch (error) {
        next(error);
      }
    },
  );

  //39. POST /api/organizations
  // Crea una organización, su rol Owner, permisos y membresía.
  router.post(
    "/",
    requireAuth,
    async (
      request: Request,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        if (!request.user) {
          throw new UnauthorizedError("Authentication required");
        }
        
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
