import React from "react";
import BaseLayout from "@/layouts/BaseLayout";
import { createRootRoute, Outlet } from "@tanstack/react-router";

export const RootRoute = createRootRoute({
    component: Root,
});

function Root() {
    return (
        <BaseLayout>
            <Outlet />
        </BaseLayout>
    );
}
