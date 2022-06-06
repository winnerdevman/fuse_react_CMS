import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm'
import { OrganizationEntity, UserEntity } from '../organization'
import { BoardEntity } from '.'

@Entity({ name: 'board_label' })
export class BoardLabelEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({nullable: false})
  labelId: string

  @Column({nullable: false})
  cardId: string
}
