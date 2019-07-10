/*
SQLyog Ultimate v12.09 (64 bit)
MySQL - 10.1.37-MariaDB : Database - bitmex_profit
*********************************************************************
*/

/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE /*!32312 IF NOT EXISTS*/`bitmex_profit` /*!40100 DEFAULT CHARACTER SET utf8mb4 */;

USE `bitmex_profit`;

/*Table structure for table `admins` */

DROP TABLE IF EXISTS `admins`;

CREATE TABLE `admins` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(200) NOT NULL DEFAULT '',
  `username` varchar(200) NOT NULL DEFAULT '',
  `password` varchar(400) NOT NULL DEFAULT '',
  `note` varchar(200) DEFAULT '',
  `emailVerified` tinyint(1) NOT NULL DEFAULT '0',
  `allow` tinyint(1) NOT NULL DEFAULT '0',
  `verifyTimestamp` varchar(60) DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COMMENT='User table';

/*Data for the table `admins` */

insert  into `admins`(`id`,`email`,`username`,`password`,`note`,`emailVerified`,`allow`,`verifyTimestamp`) values (1,'honey96dev@gmail.com','honey96dev','3449f8e3a6a7e9da0ab1129081435669da524209169b2e416530bb33f2e5bee7','',0,0,'');

/*Table structure for table `bitmex_settings` */

DROP TABLE IF EXISTS `bitmex_settings`;

CREATE TABLE `bitmex_settings` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `property` varchar(100) DEFAULT NULL,
  `value` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Bitmex Settings';

/*Data for the table `bitmex_settings` */

/*Table structure for table `users` */

DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(200) NOT NULL DEFAULT '',
  `username` varchar(200) NOT NULL DEFAULT '',
  `password` varchar(400) NOT NULL DEFAULT '',
  `note` varchar(200) DEFAULT '',
  `signedUpDate` date NOT NULL DEFAULT '0000-00-00',
  `activeTrading` tinyint(1) NOT NULL DEFAULT '0',
  `emailVerified` tinyint(1) NOT NULL DEFAULT '0',
  `allow` tinyint(1) NOT NULL DEFAULT '0',
  `verifyTimestamp` varchar(60) DEFAULT '',
  `bitmexApikey` varchar(100) DEFAULT '',
  `bitmexApikeySecret` varchar(100) DEFAULT '',
  `bitmexTestnet` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COMMENT='User table';

/*Data for the table `users` */

insert  into `users`(`id`,`email`,`username`,`password`,`note`,`signedUpDate`,`activeTrading`,`emailVerified`,`allow`,`verifyTimestamp`,`bitmexApikey`,`bitmexApikeySecret`,`bitmexTestnet`) values (1,'honey96dev@gmail.com','honey96dev','3449f8e3a6a7e9da0ab1129081435669da524209169b2e416530bb33f2e5bee7','','0000-00-00',0,0,0,'','123','qwe',0),(2,'honeyocs803@outlook.com','honeyocs803','65801e1f8d8b20ffe8c6e02c9a983e89ae9da2fe29d52d2ec8957629fe368e14','','0000-00-00',0,0,0,'','','',0),(8,'sf11asdfasdf@asf.cdc','honey96dev2','3449f8e3a6a7e9da0ab1129081435669da524209169b2e416530bb33f2e5bee7','','2019-07-09',0,0,0,'','','',0),(9,'sf@asf.cd','honey96dev3','3449f8e3a6a7e9da0ab1129081435669da524209169b2e416530bb33f2e5bee7','','2019-07-09',0,0,0,'','','',0),(10,'sf@asf.cd','qwe','3449f8e3a6a7e9da0ab1129081435669da524209169b2e416530bb33f2e5bee7','','2019-07-09',0,0,0,'','','',0),(11,'sf@asf.cd','eww','3449f8e3a6a7e9da0ab1129081435669da524209169b2e416530bb33f2e5bee7','','2019-07-09',0,0,0,'','','',0),(12,'sf@asf.cd','qwer','3449f8e3a6a7e9da0ab1129081435669da524209169b2e416530bb33f2e5bee7','','2019-07-09',0,0,0,'','','',0),(13,'sf@asf.cd','eer','3449f8e3a6a7e9da0ab1129081435669da524209169b2e416530bb33f2e5bee7','','2019-07-09',0,0,0,'','','',0),(14,'sf@asf.cd','qqqw','3449f8e3a6a7e9da0ab1129081435669da524209169b2e416530bb33f2e5bee7','','2019-07-09',0,0,0,'','','',0),(15,'sf@asf.cd','rqq','3449f8e3a6a7e9da0ab1129081435669da524209169b2e416530bb33f2e5bee7','','2019-07-09',0,0,0,'','','',0);

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
