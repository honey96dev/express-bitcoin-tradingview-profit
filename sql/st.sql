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

/*Table structure for table `bitmex_log` */

DROP TABLE IF EXISTS `bitmex_log`;

CREATE TABLE `bitmex_log` (
  `timestamp` varchar(30) NOT NULL,
  `email` varchar(60) NOT NULL DEFAULT '',
  `testnet` tinyint(1) NOT NULL DEFAULT '0',
  `apiKeyID` varchar(30) NOT NULL DEFAULT '',
  `apiKeySecret` varchar(60) NOT NULL DEFAULT '',
  `isParent` tinyint(1) NOT NULL DEFAULT '0',
  `message` varchar(100) NOT NULL DEFAULT '',
  PRIMARY KEY (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/*Table structure for table `bitmex_settings` */

DROP TABLE IF EXISTS `bitmex_settings`;

CREATE TABLE `bitmex_settings` (
  `property` varchar(100) NOT NULL,
  `value` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`property`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Bitmex Settings';

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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COMMENT='User table';

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
