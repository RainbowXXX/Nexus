import React, { useContext } from "react";
import { ChevronLeft } from "lucide-react";
import { Setting, SettingContext } from "@/components/Contexts/SettingsContext";

import { SettingPanel, useSettings} from "@/components/NexusUI/components/SettingPanel";

export default function NewSettingArea({setSettingAreaOpen}: { setSettingAreaOpen: (_: boolean) => void }) {
	const [val, setter] = useContext(SettingContext);
	const settings = useSettings(val);

	const handleCancel = () => {
		setSettingAreaOpen(false);
		console.log('放弃修改设置项');
	}

	const handleSave = () => {
		console.log("修改设置中...");
		setter(settings.value as Setting)
		setSettingAreaOpen(false);
		console.log("修改设置完成");
	}

	return (
		<SettingPanel.Root settingHook={settings}>
			<SettingPanel.SideBar>
				<SettingPanel.BackTrigger
					onClick={handleCancel}
				>
					<ChevronLeft className="mr-2 h-4 w-4" />
					返回
				</SettingPanel.BackTrigger>
				<SettingPanel.Trigger value='General' >通用</SettingPanel.Trigger>
				<SettingPanel.Trigger value='Appearance' >外观</SettingPanel.Trigger>
			</SettingPanel.SideBar>
			<SettingPanel.Content value='General' title={'通用'} asDefault>
				<SettingPanel.Item hint={'服务器地址: '} name={'serverAddress'} type={'text'} />
			</SettingPanel.Content>
			<SettingPanel.Content value='Appearance' title={'外观'}>
			</SettingPanel.Content>
			<SettingPanel.ConfirmTrigger
				onClick={handleSave}
			>
				确认
			</SettingPanel.ConfirmTrigger>
		</SettingPanel.Root>
	)
}
