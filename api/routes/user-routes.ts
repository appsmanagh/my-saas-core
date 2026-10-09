//20. estas son las rutas para user

import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";

import type { UserService } from "../../users/user-service";

//25. se importa el validation input
import { validateUpdateUserProfileInput } from "../validation/user-validation";


export function createUserRoutes(
  userService: UserService,
  requireAuth: any,
) {

  const router = Router();


  router.get(
    "/me",
    requireAuth,
    async (
      request: Request,
      response: Response,
      next: NextFunction,
    ) => {

      try {

        response.json({
          user: request.user,
        });


      } catch(error) {

        next(error);

      }

    },
  );

  router.patch(
    "/me",
    requireAuth,
    async(
    request,
    response,
    next
    )=>{

    try {
// 25. aqui se uso la function : validateUpdateUserProfileInput
    const input =
          validateUpdateUserProfileInput(
        request.body,
      );

    const user =
      await userService.updateProfile(
        request.user.id,
        input,
      );

    //25. este fue el code reemplazado
    // const user =
    //     await userService.updateProfile(
    //     request.user!.id,
    //     {
    //         name: request.body.name,
    //     },
    //     );


    response.json({
        user,
    });


    }catch(error){

    next(error);

    }

 });

 router.delete(
  "/me",
  requireAuth,
  async(
    request,
    response,
    next
  )=>{

  try {

    await userService.deleteUser(
      request.user!.id,
    );


    response.status(204).send();


  }catch(error){

    next(error);

  }

});


  return router;
}