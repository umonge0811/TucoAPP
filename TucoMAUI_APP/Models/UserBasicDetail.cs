﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TucoMAUI_APP.Models
{
    public class UserBasicDetail
    {
        public string UserName { get; set; }
        public string UserID { get; set; }
        public string AccessToken { get; set; }
        public string RefreshToken { get; set; }
        public string Email { get; set; }
        public string UserAvatar { get; set; }
    }
}
