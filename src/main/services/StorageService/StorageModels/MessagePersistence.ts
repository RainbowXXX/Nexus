import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("messages")
class MessagePersistence {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ type: "int"})
	sender!: number;

	@Column({ type: "enum", enum: ["text"] })
	messageType!: string;

	@Column({ type: "int64" })
	timestamp!: number;

	@Column({ type: "enum", enum: ["string", "number", "binary", "extern_path"] })
	dataType!: string;

	@Column()
	messageData!: any;
}

export {
	MessagePersistence
}
