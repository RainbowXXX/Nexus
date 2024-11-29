import React from "react";
import DragWindowRegion from "@/components/DragWindowRegion";

import styles from "@/styles/BaseLayout.module.css";
import WindowStatusProvider from "@/components/Contexts/ContextProviders/WindowStatusProvider";
import SettingProvider from "@/components/Contexts/ContextProviders/SettingsProvider";
import ChatInfoProvider from "@/components/Contexts/ContextProviders/ChatInfoProvider";

export default function BaseLayout({ children }: { children: React.ReactNode }) {
    return (
		<WindowStatusProvider>
			<SettingProvider>
				<ChatInfoProvider>
					<div style={{height : '100%', display: 'flex',flexDirection:'column'}}>
						<div className={styles.container}>
							<DragWindowRegion title="Nexus" />
							{/* <NavigationMenu /> */}
							<hr />
						</div>
						<main>{children}</main>
					</div>
				</ChatInfoProvider>
			</SettingProvider>
		</WindowStatusProvider>
    );
}
