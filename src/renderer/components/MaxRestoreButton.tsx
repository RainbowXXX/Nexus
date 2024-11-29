import React, { useContext } from "react";
import { useTranslation } from "react-i18next";
import { WindowStatusContext } from "@/components/Contexts/WindowStatusContext";

export default function MaxRestoreButton({ maximizeWindow }: { maximizeWindow: () => {} }) {
	const { t } = useTranslation();
	const windowStatus = useContext<WindowStatus>(WindowStatusContext);
	const isMaximize = windowStatus.status.isMaximized;

	return (
		<button
			title={isMaximize ? t("Restore") : t("Maximize")}
			type="button"
			className="p-2 hover:bg-slate-300"
			onClick={() => {
				maximizeWindow();
			}}
		>
			<svg aria-hidden="true" role="img" width="12" height="12" viewBox="0 0 12 12">
				{isMaximize
					?
					<>
						<rect
							width="7"
							height="7"
							x="1.5"
							y="3.5"
							fill="none"
							stroke="currentColor"
						/>
						<polyline points="3.5,1 3.5,4" stroke="currentColor" fill="none" />
						<polyline points="3,1.5 11,1.5" stroke="currentColor" fill="none" />
						<polyline points="10.5,1 10.5,9" stroke="currentColor" fill="none" />
						<polyline points="11,8.5 8,8.5" stroke="currentColor" fill="none" />
					</>
					:
					<rect width="9" height="9" x="1.5" y="1.5" fill="none" stroke="currentColor" />
				}

			</svg>
		</button>
	);
}
