import React from "react";
import DragWindowRegion from "@/components/DragWindowRegion";

import styles from "@/styles/BaseLayout.module.css";
import WindowStatusProvider from "@/components/Contexts/WindowStatusContext";
import SettingProvider from "@/components/Contexts/SettingsContext";
import ChatInfoProvider from "@/components/Contexts/ChatInfoContext";

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
